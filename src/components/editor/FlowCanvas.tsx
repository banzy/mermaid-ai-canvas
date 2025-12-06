import { useCallback, useEffect, useState, memo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Panel,
  NodeProps,
  Handle,
  Position,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/stores/useAppStore';
import { parseMermaidToFlow, flowToMermaid } from '@/lib/mermaidParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Type } from 'lucide-react';
import { toast } from 'sonner';

type CustomNodeData = { label: string };

// Constants for grid alignment
const GRID_SIZE = 20;
const NODE_WIDTH = 120; // Fixed width that's a multiple of gridSize (120 = 6 * 20)

// Custom node component
const CustomNode = memo(({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  
  return (
    <div
      className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
        selected 
          ? 'border-primary bg-primary/10 shadow-glow' 
          : 'border-border bg-card hover:border-primary/50'
      }`}
      style={{ width: `${NODE_WIDTH}px`, minWidth: `${NODE_WIDTH}px` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <span className="text-sm font-medium text-foreground block text-center">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = { custom: CustomNode };

export const FlowCanvas = () => {
  const { editor, setCode } = useAppStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [direction, setDirection] = useState<string>('TD');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const gridSize = GRID_SIZE;
  
  // Persistent memory for node positions to handle temporary disappearances (e.g. while typing)
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Helper to snap position to grid
  // For nodes, we need to account for node width to align handles to grid
  const snapToGrid = useCallback((position: { x: number; y: number }, centerAlign: boolean = false) => {
    if (centerAlign) {
      // Align node center to grid, then adjust position
      const centerX = Math.round((position.x + NODE_WIDTH / 2) / gridSize) * gridSize;
      const centerY = Math.round((position.y + NODE_WIDTH / 2) / gridSize) * gridSize;
      return {
        x: centerX - NODE_WIDTH / 2,
        y: centerY - NODE_WIDTH / 2,
      };
    }
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  }, [gridSize]);

  // Sync changes back to mermaid code (debounced)
  const syncToCode = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const code = flowToMermaid(newNodes, newEdges, direction);
    setCode(code);
  }, [direction, setCode]);

  // Parse mermaid code when it changes
  useEffect(() => {
    try {
      const parsed = parseMermaidToFlow(editor.code);
      
      // If direction changed, we should probably reset/re-layout to respect the new direction
      const directionChanged = parsed.direction !== direction;
      
      setNodes((currentNodes) => {
        // If direction changed, use the auto-layout positions from the parser
        if (directionChanged) {
          nodePositionsRef.current.clear(); // Clear cache on layout change
          const snapped = parsed.nodes.map(n => ({
            ...n,
            position: snapToGrid(n.position, true)
          }));
          // Initialize cache with new positions
          snapped.forEach(n => nodePositionsRef.current.set(n.id, n.position));
          return snapped;
        }

        // Hydrate new nodes with cached positions
        return parsed.nodes.map(newNode => {
          // Check cache first, then current nodes (though cache should be up to date)
          const cachedPos = nodePositionsRef.current.get(newNode.id);
          
          if (cachedPos) {
            return {
              ...newNode,
              position: cachedPos
            };
          }
          
          // Truly new node: use parsed position (auto-layout) and snap to grid
          const snappedPos = snapToGrid(newNode.position, true);
          // Add to cache immediately
          nodePositionsRef.current.set(newNode.id, snappedPos);
          
          return {
            ...newNode,
            position: snappedPos
          };
        });
      });

      setEdges(parsed.edges);
      setDirection(parsed.direction);
      setParseError(null);
    } catch (err) {
      setParseError('Unable to parse diagram');
    }
  }, [editor.code, setNodes, setEdges, gridSize, snapToGrid, direction]);

  const handleNodesChange = useCallback((changes: NodeChange<Node<CustomNodeData>>[]) => {
    // Apply changes and snap positions to grid (center-aligned for handle alignment)
    const processedChanges = changes.map(change => {
      if (change.type === 'position' && change.position) {
        return {
          ...change,
          position: snapToGrid(change.position, true),
        };
      }
      return change;
    });
    
    onNodesChange(processedChanges);
    
    // Update cache with new positions
    setNodes(currentNodes => {
      currentNodes.forEach(node => {
        nodePositionsRef.current.set(node.id, node.position);
      });
      return currentNodes;
    });
  }, [onNodesChange, setNodes, snapToGrid]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const onConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
      id: `${params.source}-${params.target}-${Date.now()}`,
      source: params.source!,
      target: params.target!,
      type: 'step',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
    };
    setEdges(eds => {
      const updated = addEdge(newEdge, eds);
      setTimeout(() => syncToCode(nodes, updated), 0);
      return updated;
    });
    toast.success('Connection added');
  }, [setEdges, nodes, syncToCode]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node<CustomNodeData>) => {
    setSelectedNode(node);
    setEditingLabel(node.data?.label || '');
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback(() => {
    const id = `node_${Date.now()}`;
    const initialPos = { 
      x: 200 + Math.random() * 100, 
      y: 200 + Math.random() * 100 
    };
    const newNode: Node = {
      id,
      position: snapToGrid(initialPos, true),
      data: { label: 'New Node' },
      type: 'custom',
    };
    setNodes(nds => {
      const updated = [...nds, newNode];
      syncToCode(updated, edges);
      return updated;
    });
    toast.success('Node added');
  }, [setNodes, edges, syncToCode, snapToGrid]);

  const deleteSelected = useCallback(() => {
    if (!selectedNode) return;
    setNodes(nds => {
      const updated = nds.filter(n => n.id !== selectedNode.id);
      setEdges(eds => {
        const filteredEdges = eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
        syncToCode(updated, filteredEdges);
        return filteredEdges;
      });
      return updated;
    });
    setSelectedNode(null);
    toast.success('Node deleted');
  }, [selectedNode, setNodes, setEdges, syncToCode]);

  const updateNodeLabel = useCallback(() => {
    if (!selectedNode || !editingLabel.trim()) return;
    setNodes(nds => {
      const updated = nds.map(n => 
        n.id === selectedNode.id 
          ? { ...n, data: { ...n.data, label: editingLabel.trim() } }
          : n
      );
      syncToCode(updated, edges);
      return updated;
    });
    toast.success('Label updated');
  }, [selectedNode, editingLabel, setNodes, edges, syncToCode]);

  // Snap all nodes to grid
  const snapAllNodesToGrid = useCallback(() => {
    setNodes((currentNodes: Node<CustomNodeData>[]) => {
      const updated = currentNodes.map(node => ({
        ...node,
        position: snapToGrid(node.position),
      }));
      syncToCode(updated, edges);
      return updated;
    });
  }, [setNodes, edges, syncToCode, snapToGrid]);

  return (
    <div className="h-full w-full rounded-lg border border-border bg-background overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[gridSize, gridSize]}
        connectionLineType={ConnectionLineType.Step}
        defaultEdgeOptions={{
          type: 'step',
          style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--border))" gap={gridSize} size={1} />
        <Controls className="[&>button]:bg-card [&>button]:border-border [&>button]:text-foreground [&>button:hover]:bg-secondary" />
        <MiniMap 
          className="!bg-card !border-border"
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.8)"
        />

        {/* Toolbar */}
        <Panel position="top-left" className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={addNode}>
            <Plus className="h-4 w-4 mr-1" />
            Add Node
          </Button>
          {selectedNode && (
            <Button size="sm" variant="destructive" onClick={deleteSelected}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </Panel>

        {/* Node Editor Panel */}
        {selectedNode && (
          <Panel position="top-right" className="glass rounded-lg p-3 min-w-[200px]">
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">Edit Node</div>
              <div className="flex gap-2">
                <Input
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateNodeLabel()}
                  placeholder="Node label"
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={updateNodeLabel} className="h-8">
                  <Type className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                ID: {selectedNode.id}
              </div>
            </div>
          </Panel>
        )}

        {/* Error Display */}
        {parseError && (
          <Panel position="bottom-center" className="glass rounded-lg px-4 py-2 text-sm text-warning">
            {parseError}
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

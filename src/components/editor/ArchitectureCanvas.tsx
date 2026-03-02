import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_OPERATIONAL_POSITIONS, BLOCK_TYPE_COLORS } from '@/lib/examples';
import OperationalNode from './OperationalNode';

const nodeTypes = { operational: OperationalNode };

const RELATION_TYPE_STYLES: Record<string, { stroke: string; strokeDasharray?: string }> = {
  feeds:           { stroke: 'hsl(187 85% 53%)' },
  transforms_into: { stroke: 'hsl(262 83% 58%)' },
  updates:         { stroke: 'hsl(38 92% 50%)', strokeDasharray: '6 3' },
  persists_to:     { stroke: 'hsl(142 76% 36%)', strokeDasharray: '4 4' },
  triggers:        { stroke: 'hsl(340 80% 55%)' },
  depends_on:      { stroke: 'hsl(210 90% 55%)', strokeDasharray: '8 4' },
  contains:        { stroke: 'hsl(215 20% 40%)' },
  explains:        { stroke: 'hsl(262 60% 50%)', strokeDasharray: '3 3' },
};

export const ArchitectureCanvas = () => {
  const project = useAppStore((s) => s.project);
  const selectedView = useAppStore((s) => s.selectedView);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);

  // Pick the right block set based on current view
  const blocks = useMemo(() => {
    if (selectedView === 'operational') return project.operationalBlocks;
    if (selectedView === 'functional') return project.functionalBlocks;
    return project.operationalBlocks; // fallback
  }, [selectedView, project]);

  // Get only relations relevant to current blocks
  const blockIds = useMemo(() => new Set(blocks.map(b => b.id)), [blocks]);

  const relevantRelations = useMemo(() =>
    project.relations.filter(r => blockIds.has(r.from) && blockIds.has(r.to)),
    [project.relations, blockIds]
  );

  // Build React Flow nodes
  const nodes: Node[] = useMemo(() => {
    // Auto-layout: use default positions for operational, grid for others
    return blocks.map((block, idx) => {
      const defaultPos = DEFAULT_OPERATIONAL_POSITIONS[block.id];
      const position = defaultPos || {
        x: (idx % 4) * 300,
        y: Math.floor(idx / 4) * 200,
      };

      return {
        id: block.id,
        type: 'operational',
        position,
        selected: selectedNodeId === block.id,
        data: {
          label: block.label,
          description: block.description || '',
          blockType: block.type,
        },
      };
    });
  }, [blocks, selectedNodeId]);

  // Build React Flow edges
  const edges: Edge[] = useMemo(() =>
    relevantRelations.map((r) => {
      const style = RELATION_TYPE_STYLES[r.type] || { stroke: 'hsl(215 20% 40%)' };
      return {
        id: r.id,
        source: r.from,
        target: r.to,
        type: 'smoothstep',
        animated: r.type === 'feeds' || r.type === 'transforms_into',
        label: r.label || undefined,
        style: {
          stroke: style.stroke,
          strokeWidth: 2,
          strokeDasharray: style.strokeDasharray,
        },
        labelStyle: {
          fill: 'hsl(215 20% 55%)',
          fontSize: 10,
          fontWeight: 500,
        },
      };
    }),
    [relevantRelations]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="h-full w-full rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'hsl(222 47% 5%)' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'hsl(215 20% 40%)', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background
          color="hsl(222 30% 15%)"
          gap={24}
          size={1}
        />
        <Controls
          className="[&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700"
        />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor="hsl(187 85% 53%)"
          maskColor="hsla(222 47% 6% / 0.85)"
          style={{ borderRadius: 12 }}
        />
      </ReactFlow>
    </div>
  );
};

import { useCallback, useMemo, useEffect, memo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_OPERATIONAL_POSITIONS, BLOCK_TYPE_COLORS } from '@/lib/examples';
import { cn } from '@/lib/utils';
import type { BlockNode } from '@/lib/schemas';
import OperationalNode from './OperationalNode';

// ── Layer group layout constants ───────────────────────────────────────────────

const LAYER_COLORS: Record<string, string> = {
  'UI Layer':            'hsl(210 90% 60%)',
  'State Layer':         'hsl(262 83% 65%)',
  'Sensor Layer':        'hsl(142 70% 45%)',
  'Computation Layer':   'hsl(38 92% 55%)',
  'Coach Layer':         'hsl(340 80% 60%)',
  'Audio Layer':         'hsl(187 85% 53%)',
  'Voice Command Layer': 'hsl(25 95% 60%)',
  'Storage Layer':       'hsl(55 80% 52%)',
  'System Utilities':    'hsl(215 20% 60%)',
};

const GROUP_WIDTH = 260;
const CHILD_HEIGHT = 62;
const CHILD_GAP = 8;
const GROUP_HEADER_H = 48;
const GROUP_PAD = 12;

const groupH = (n: number) =>
  GROUP_HEADER_H + GROUP_PAD + n * (CHILD_HEIGHT + CHILD_GAP) - CHILD_GAP + GROUP_PAD;

// Pre-computed 4-column layout (col width=260, col gap=30)
// Col 0 (x=0):   UI(h=472), VoiceCmd(h=200)   → stacked at y=0, 492
// Col 1 (x=290): State(h=200), Sensor(h=268), Comp(h=268)
// Col 2 (x=580): Coach(h=336), Audio(h=268)
// Col 3 (x=870): Storage(h=404), SysUtils(h=268)
const LAYER_POSITIONS: Record<string, { x: number; y: number }> = {
  'UI Layer':            { x: 0,   y: 0   },
  'Voice Command Layer': { x: 0,   y: 492 },
  'State Layer':         { x: 290, y: 0   },
  'Sensor Layer':        { x: 290, y: 220 },
  'Computation Layer':   { x: 290, y: 508 },
  'Coach Layer':         { x: 580, y: 0   },
  'Audio Layer':         { x: 580, y: 356 },
  'Storage Layer':       { x: 870, y: 0   },
  'System Utilities':    { x: 870, y: 424 },
};

// ── Custom node: Layer group container ────────────────────────────────────────

const LayerGroupNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; color: string; count: number };
  return (
    <div
      className="h-full w-full rounded-xl border-2"
      style={{ borderColor: `${d.color}35`, background: `${d.color}07` }}
    >
      <div
        className="flex items-center gap-2 px-3 rounded-t-xl border-b"
        style={{ height: GROUP_HEADER_H, borderColor: `${d.color}30`, background: `${d.color}14` }}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
        <span
          className="text-[11px] font-bold uppercase tracking-widest truncate"
          style={{ color: d.color }}
        >
          {d.label}
        </span>
        <span
          className="ml-auto text-[10px] font-mono tabular-nums shrink-0 px-1.5 py-0.5 rounded-full"
          style={{ color: d.color, background: `${d.color}18` }}
        >
          {d.count}
        </span>
      </div>
    </div>
  );
});
LayerGroupNode.displayName = 'LayerGroupNode';

// ── Custom node: Functional block child ───────────────────────────────────────

const FunctionalBlockNode = memo(({ data, selected }: NodeProps) => {
  const d = data as { label: string; description: string; blockType: string; color: string };
  return (
    <div
      className={cn(
        'h-full w-full rounded-lg border px-2.5 py-2 transition-all cursor-pointer select-none',
        selected && 'ring-1'
      )}
      style={{
        background: selected ? `${d.color}1A` : `${d.color}0C`,
        borderColor: selected ? d.color : `${d.color}35`,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-semibold text-zinc-200 leading-tight truncate">
          {d.label}
        </span>
        <span
          className="shrink-0 text-[9px] uppercase font-medium px-1 py-0.5 rounded"
          style={{ color: d.color, background: `${d.color}1A` }}
        >
          {d.blockType}
        </span>
      </div>
      {d.description && (
        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-tight">
          {d.description}
        </p>
      )}
    </div>
  );
});
FunctionalBlockNode.displayName = 'FunctionalBlockNode';

// ── Node type registry ────────────────────────────────────────────────────────

const nodeTypes = {
  operational:   OperationalNode,
  layerGroup:    LayerGroupNode,
  functionalBlock: FunctionalBlockNode,
};

// ── Edge styles ───────────────────────────────────────────────────────────────

const RELATION_STYLES: Record<string, { stroke: string; strokeDasharray?: string }> = {
  feeds:           { stroke: 'hsl(187 85% 53%)' },
  transforms_into: { stroke: 'hsl(262 83% 58%)' },
  updates:         { stroke: 'hsl(38 92% 50%)',  strokeDasharray: '6 3' },
  persists_to:     { stroke: 'hsl(142 76% 36%)', strokeDasharray: '4 4' },
  triggers:        { stroke: 'hsl(340 80% 55%)' },
  depends_on:      { stroke: 'hsl(210 90% 55%)', strokeDasharray: '8 4' },
  contains:        { stroke: 'hsl(215 20% 40%)' },
  explains:        { stroke: 'hsl(262 60% 50%)', strokeDasharray: '3 3' },
};

// ── Main component ────────────────────────────────────────────────────────────

export const ArchitectureCanvas = () => {
  const project          = useAppStore((s) => s.project);
  const selectedView     = useAppStore((s) => s.selectedView);
  const selectedNodeId   = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId   = useAppStore((s) => s.setSelectedNodeId);
  const updateNodePosition  = useAppStore((s) => s.updateNodePosition);

  const operationalBlocks = useMemo(() => project.operationalBlocks, [project.operationalBlocks]);

  const operationalBlockIds = useMemo(
    () => new Set(operationalBlocks.map((b) => b.id)),
    [operationalBlocks]
  );

  const relevantRelations = useMemo(
    () => project.relations.filter((r) => operationalBlockIds.has(r.from) && operationalBlockIds.has(r.to)),
    [project.relations, operationalBlockIds]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // ── Node sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedView === 'functional') {
      // Group functional blocks by layer
      const layerMap = new Map<string, BlockNode[]>();
      for (const block of project.functionalBlocks) {
        const layer = (block.metadata?.layer as string) ?? 'Other';
        if (!layerMap.has(layer)) layerMap.set(layer, []);
        layerMap.get(layer)!.push(block);
      }

      const newNodes: Node[] = [];
      for (const [layer, layerBlocks] of layerMap) {
        const color   = LAYER_COLORS[layer] ?? 'hsl(215 20% 60%)';
        const pos     = LAYER_POSITIONS[layer] ?? { x: 0, y: 0 };
        const height  = groupH(layerBlocks.length);
        const groupId = `layer-group-${layer.replace(/\s+/g, '-').toLowerCase()}`;

        // Group container node
        newNodes.push({
          id: groupId,
          type: 'layerGroup',
          position: pos,
          style: { width: GROUP_WIDTH, height },
          data: { label: layer, color, count: layerBlocks.length },
          selectable: false,
          draggable: true,
          zIndex: 0,
        } as Node);

        // Child block nodes (relative to group)
        layerBlocks.forEach((block, i) => {
          newNodes.push({
            id: block.id,
            type: 'functionalBlock',
            parentId: groupId,
            extent: 'parent',
            position: {
              x: GROUP_PAD,
              y: GROUP_HEADER_H + GROUP_PAD + i * (CHILD_HEIGHT + CHILD_GAP),
            },
            style: { width: GROUP_WIDTH - GROUP_PAD * 2, height: CHILD_HEIGHT },
            data: {
              label:       block.label,
              description: block.description ?? '',
              blockType:   block.type,
              color,
            },
            selected: selectedNodeId === block.id,
            draggable: false,
            zIndex: 1,
          } as Node);
        });
      }
      setNodes(newNodes);
      return;
    }

    // Operational / flow (fallback)
    setNodes((currentNodes) => {
      const posMap = new Map(currentNodes.map((n) => [n.id, n.position]));
      return operationalBlocks.map((block, idx) => {
        const existingPos = posMap.get(block.id);
        const storedPos   = block.position;
        const defaultPos  = DEFAULT_OPERATIONAL_POSITIONS[block.id];
        const position = {
          x: existingPos?.x ?? storedPos?.x ?? defaultPos?.x ?? (idx % 4) * 300,
          y: existingPos?.y ?? storedPos?.y ?? defaultPos?.y ?? Math.floor(idx / 4) * 200,
        };
        return {
          id: block.id,
          type: 'operational',
          position,
          selected: selectedNodeId === block.id,
          data: {
            label:       block.label,
            description: block.description ?? '',
            blockType:   block.type,
          },
        };
      });
    });
  }, [selectedView, project.functionalBlocks, operationalBlocks, selectedNodeId, setNodes]);

  // ── Edge sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedView === 'functional') {
      setEdges([]);
      return;
    }
    setEdges(
      relevantRelations.map((r) => {
        const style = RELATION_STYLES[r.type] ?? { stroke: 'hsl(215 20% 40%)' };
        return {
          id:       r.id,
          source:   r.from,
          target:   r.to,
          type:     'smoothstep',
          animated: r.type === 'feeds' || r.type === 'transforms_into',
          label:    r.label ?? undefined,
          style: {
            stroke:          style.stroke,
            strokeWidth:     2,
            strokeDasharray: style.strokeDasharray,
          },
          labelStyle: { fill: 'hsl(215 20% 55%)', fontSize: 10, fontWeight: 500 },
        };
      })
    );
  }, [selectedView, relevantRelations, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== 'layerGroup') setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (selectedView === 'operational') updateNodePosition(node.id, node.position);
    },
    [selectedView, updateNodePosition]
  );

  return (
    <div
      className="h-full w-full rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'hsl(222 47% 5%)' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        snapToGrid={true}
        snapGrid={[24, 24]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'hsl(215 20% 40%)', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="hsl(222 30% 25%)" gap={24} size={1.5} variant={BackgroundVariant.Dots} />
        <Controls className="[&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700" />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor={(n) =>
            n.type === 'layerGroup'
              ? (n.data as { color: string }).color + '60'
              : n.type === 'functionalBlock'
              ? (n.data as { color: string }).color
              : 'hsl(187 85% 53%)'
          }
          maskColor="hsla(222 47% 6% / 0.85)"
          style={{ borderRadius: 12 }}
        />
      </ReactFlow>
    </div>
  );
};

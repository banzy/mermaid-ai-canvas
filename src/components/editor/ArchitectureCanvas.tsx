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
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_OPERATIONAL_POSITIONS, BLOCK_TYPE_COLORS } from '@/lib/examples';
import { cn } from '@/lib/utils';
import type { BlockNode } from '@/lib/schemas';
import OperationalNode from './OperationalNode';

// ── Color palette per layer ────────────────────────────────────────────────────

const LAYER_PALETTE: Record<string, { hue: number; icon: string }> = {
  'UI Layer':            { hue: 210, icon: '🖥' },
  'State Layer':         { hue: 262, icon: '⚙' },
  'Sensor Layer':        { hue: 142, icon: '📡' },
  'Computation Layer':   { hue: 38,  icon: '🔢' },
  'Coach Layer':         { hue: 340, icon: '🏃' },
  'Audio Layer':         { hue: 187, icon: '🔊' },
  'Voice Command Layer': { hue: 25,  icon: '🎤' },
  'Storage Layer':       { hue: 55,  icon: '💾' },
  'System Utilities':    { hue: 215, icon: '🛠' },
};

const getLayerColor = (layer: string, alpha = '1'): string => {
  const p = LAYER_PALETTE[layer];
  const hue = p?.hue ?? 215;
  return `hsla(${hue} 75% 55% / ${alpha})`;
};

const getLayerIcon = (layer: string) => LAYER_PALETTE[layer]?.icon ?? '📦';

// ── Layout constants ──────────────────────────────────────────────────────────

const COL_WIDTH    = 280;  // width of each layer group column
const COL_GAP      = 28;   // horizontal gap between columns
const ROW_GAP      = 24;   // vertical gap between groups in the same column
const HEADER_H     = 52;   // group header height
const PAD          = 10;   // internal padding
const CHILD_H      = 66;   // height of each child block
const CHILD_GAP    = 6;    // vertical gap between child blocks
const NUM_COLS     = 4;    // max columns

const groupHeight = (childCount: number) =>
  HEADER_H + PAD + childCount * (CHILD_H + CHILD_GAP) - CHILD_GAP + PAD;

/**
 * Auto-layout: pack layers into NUM_COLS columns using a "shortest column" strategy.
 */
function computeLayerPositions(
  layerMap: Map<string, BlockNode[]>
): Map<string, { x: number; y: number }> {
  const colHeights = Array(NUM_COLS).fill(0);
  const positions  = new Map<string, { x: number; y: number }>();

  // fixed column order if we can match the known layers, else just pack
  const ORDER: string[] = [
    'UI Layer',
    'State Layer',
    'Sensor Layer',
    'Computation Layer',
    'Coach Layer',
    'Audio Layer',
    'Voice Command Layer',
    'Storage Layer',
    'System Utilities',
  ];

  const ordered: string[] = [
    ...ORDER.filter((l) => layerMap.has(l)),
    ...[...layerMap.keys()].filter((l) => !ORDER.includes(l)),
  ];

  ordered.forEach((layer) => {
    const count = layerMap.get(layer)!.length;
    const h     = groupHeight(count);

    // Find the column with the least accumulated height
    let shortestCol = 0;
    for (let c = 1; c < NUM_COLS; c++) {
      if (colHeights[c] < colHeights[shortestCol]) shortestCol = c;
    }

    const x = shortestCol * (COL_WIDTH + COL_GAP);
    const y = colHeights[shortestCol];
    positions.set(layer, { x, y });

    colHeights[shortestCol] += h + ROW_GAP;
  });

  return positions;
}

// ── Custom node: Layer group container ────────────────────────────────────────

const LayerGroupNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; color: string; borderColor: string; icon: string; count: number };
  return (
    <div
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{
        border: `1.5px solid ${d.borderColor}`,
        background: `${d.color}`,
        boxShadow: `0 0 0 1px ${d.borderColor}22, 0 8px 32px ${d.borderColor}18`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Group header */}
      <div
        className="flex items-center gap-2.5 px-3"
        style={{
          height: HEADER_H,
          borderBottom: `1px solid ${d.borderColor}`,
          background: `${d.borderColor}22`,
        }}
      >
        <span className="text-base leading-none">{d.icon}</span>
        <span
          className="text-[11px] font-extrabold uppercase tracking-[0.12em] truncate"
          style={{ color: d.borderColor }}
        >
          {d.label}
        </span>
        <span
          className="ml-auto shrink-0 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full"
          style={{
            color: d.borderColor,
            background: `${d.borderColor}22`,
            border: `1px solid ${d.borderColor}44`,
          }}
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
  const d = data as {
    label: string;
    description: string;
    blockType: string;
    color: string;
    dotColor: string;
  };
  return (
    <div
      className={cn(
        'h-full w-full rounded-xl px-2.5 py-2 transition-all duration-150 cursor-pointer select-none',
        'flex flex-col justify-between',
        selected && 'ring-1 ring-offset-0'
      )}
      style={{
        background: selected ? `${d.dotColor}22` : `${d.dotColor}0F`,
        border: `1px solid ${selected ? d.dotColor : d.dotColor + '40'}`,
        boxShadow: selected ? `0 0 12px ${d.dotColor}30` : 'none',
      }}
    >
      {/* Hidden handles so ReactFlow doesn't complain */}
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, width: 1, height: 1 }} />

      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
            style={{ background: d.dotColor }}
          />
          <span className="text-[11px] font-semibold text-zinc-200 leading-tight truncate">
            {d.label}
          </span>
        </div>
        <span
          className="shrink-0 text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded"
          style={{ color: d.dotColor, background: `${d.dotColor}1A`, letterSpacing: '0.05em' }}
        >
          {d.blockType}
        </span>
      </div>

      {d.description && (
        <p className="text-[9.5px] text-zinc-500 mt-1 line-clamp-2 leading-tight">
          {d.description}
        </p>
      )}
    </div>
  );
});
FunctionalBlockNode.displayName = 'FunctionalBlockNode';

// ── Node type registry ─────────────────────────────────────────────────────────

const nodeTypes = {
  operational:     OperationalNode,
  layerGroup:      LayerGroupNode,
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

// ── Main component ─────────────────────────────────────────────────────────────

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

      const positions = computeLayerPositions(layerMap);
      const newNodes: Node[] = [];

      for (const [layer, layerBlocks] of layerMap) {
        const pos      = positions.get(layer) ?? { x: 0, y: 0 };
        const height   = groupHeight(layerBlocks.length);
        const groupId  = `layer-group-${layer.replace(/\s+/g, '-').toLowerCase()}`;
        const dotColor = getLayerColor(layer);
        const bgColor  = getLayerColor(layer, '0.06');
        const icon     = getLayerIcon(layer);

        // Layer group container
        newNodes.push({
          id:       groupId,
          type:     'layerGroup',
          position: pos,
          style:    { width: COL_WIDTH, height },
          data: {
            label:       layer,
            icon,
            color:       bgColor,
            borderColor: dotColor,
            count:       layerBlocks.length,
          },
          selectable: false,
          draggable:  true,
          zIndex:     0,
        } as Node);

        // Child block nodes (positioned relative to parent group)
        layerBlocks.forEach((block, i) => {
          newNodes.push({
            id:       block.id,
            type:     'functionalBlock',
            parentId: groupId,
            extent:   'parent',
            position: {
              x: PAD,
              y: HEADER_H + PAD + i * (CHILD_H + CHILD_GAP),
            },
            style: {
              width:  COL_WIDTH - PAD * 2,
              height: CHILD_H,
            },
            data: {
              label:       block.label,
              description: block.description ?? '',
              blockType:   block.type,
              color:       bgColor,
              dotColor,
            },
            selected:  selectedNodeId === block.id,
            draggable: false,
            zIndex:    1,
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
          id:       block.id,
          type:     'operational',
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
        fitViewOptions={{ padding: 0.15 }}
        snapToGrid={true}
        snapGrid={[8, 8]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'hsl(215 20% 40%)', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.05}
        maxZoom={2}
      >
        <Background color="hsl(222 30% 20%)" gap={24} size={1} variant={BackgroundVariant.Dots} />
        <Controls className="[&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700" />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor={(n) =>
            n.type === 'layerGroup'
              ? (n.data as { borderColor: string }).borderColor + '80'
              : n.type === 'functionalBlock'
              ? (n.data as { dotColor: string }).dotColor + 'cc'
              : 'hsl(187 85% 53%)'
          }
          maskColor="hsla(222 47% 6% / 0.88)"
          style={{ borderRadius: 12 }}
        />
      </ReactFlow>
    </div>
  );
};

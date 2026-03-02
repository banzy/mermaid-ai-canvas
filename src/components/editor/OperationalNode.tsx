import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { BLOCK_TYPE_COLORS } from '@/lib/examples';

type OperationalNodeData = {
  label: string;
  description?: string;
  blockType?: string;
};

const OperationalNode = memo(({ data, selected }: NodeProps<Node<OperationalNodeData>>) => {
  const accentColor = BLOCK_TYPE_COLORS[data.blockType || ''] || 'hsl(187 85% 53%)';

  return (
    <div
      className={[
        'min-w-[240px] max-w-[280px] rounded-2xl border px-5 py-4 shadow-xl backdrop-blur-xl transition-all duration-200',
        selected
          ? 'border-white/30 ring-2 ring-white/15 scale-[1.02]'
          : 'border-white/10 hover:border-white/20',
      ].join(' ')}
      style={{
        background: selected
          ? `linear-gradient(135deg, hsl(222 47% 12%), hsl(222 47% 15%))`
          : `linear-gradient(135deg, hsl(222 47% 9%), hsl(222 47% 11%))`,
        boxShadow: selected
          ? `0 0 30px ${accentColor}33, 0 8px 32px rgba(0,0,0,0.4)`
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !border-2 !border-zinc-600 !-left-[6px]"
        style={{ background: accentColor }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-60"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="text-sm font-semibold text-white leading-tight">{data.label}</div>
        {data.blockType && (
          <div
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              color: accentColor,
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            {data.blockType}
          </div>
        )}
      </div>

      {data.description && (
        <div className="text-xs leading-relaxed text-zinc-400 line-clamp-2">
          {data.description}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !border-2 !border-zinc-600 !-right-[6px]"
        style={{ background: accentColor }}
      />
    </div>
  );
});

OperationalNode.displayName = 'OperationalNode';

export default OperationalNode;

import { useAppStore } from '@/stores/useAppStore';
import { BLOCK_TYPE_COLORS } from '@/lib/examples';
import { ArrowRight, Layers, GitBranch } from 'lucide-react';

export const NarrativePanel = () => {
  const project = useAppStore((s) => s.project);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const selectedView = useAppStore((s) => s.selectedView);

  const blocks =
    selectedView === 'operational'
      ? project.operationalBlocks
      : project.functionalBlocks;

  const selectedBlock = blocks.find((b) => b.id === selectedNodeId);

  // Find relations for selected block
  const relatedRelations = selectedNodeId
    ? project.relations.filter(
        (r) => r.from === selectedNodeId || r.to === selectedNodeId
      )
    : [];

  // Find children blocks of selected block
  const childBlocks = selectedBlock?.children
    ? project.functionalBlocks.filter((fb) =>
        selectedBlock.children!.includes(fb.id)
      )
    : [];

  return (
    <div className="h-full rounded-2xl border border-white/10 overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, hsl(222 47% 8%), hsl(222 47% 6%))' }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-5 py-3">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {selectedBlock ? 'Block Inspector' : 'Architecture Summary'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin space-y-5">
        {!selectedBlock ? (
          /* ─── Architecture Summary ──────────────────────────────────────── */
          <>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                {project.name}
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                {project.description}
              </p>
            </div>

            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Operational Blocks
                </span>
              </div>
              <div className="space-y-2">
                {project.operationalBlocks.map((block) => {
                  const color = BLOCK_TYPE_COLORS[block.type] || 'hsl(215 20% 55%)';
                  return (
                    <button
                      key={block.id}
                      onClick={() => useAppStore.getState().setSelectedNodeId(block.id)}
                      className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 group"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                          {block.label}
                        </div>
                        {block.description && (
                          <div className="text-xs text-zinc-500 truncate">
                            {block.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flows summary */}
            {project.flows.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Key Flows
                  </span>
                </div>
                <div className="space-y-2">
                  {project.flows.map((flow) => (
                    <div
                      key={flow.id}
                      className="rounded-xl border border-white/5 px-3 py-2.5 bg-white/[0.02]"
                    >
                      <div className="text-sm font-medium text-zinc-300 mb-1.5">
                        {flow.label}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {flow.steps.map((step, i) => (
                          <span key={i} className="flex items-center gap-1 text-[11px] text-zinc-500">
                            {i > 0 && <ArrowRight className="h-2.5 w-2.5 text-zinc-600" />}
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─── Block Inspector ───────────────────────────────────────────── */
          <>
            {/* Block header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background:
                      BLOCK_TYPE_COLORS[selectedBlock.type] || 'hsl(215 20% 55%)',
                  }}
                />
                <h2 className="text-lg font-semibold text-white">
                  {selectedBlock.label}
                </h2>
              </div>
              <div
                className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider mb-3"
                style={{
                  color: BLOCK_TYPE_COLORS[selectedBlock.type] || 'hsl(215 20% 55%)',
                  background: `${BLOCK_TYPE_COLORS[selectedBlock.type] || 'hsl(215 20% 55%)'}15`,
                  border: `1px solid ${BLOCK_TYPE_COLORS[selectedBlock.type] || 'hsl(215 20% 55%)'}30`,
                }}
              >
                {selectedBlock.type} · {selectedBlock.kind}
              </div>
              {selectedBlock.description && (
                <p className="text-sm leading-relaxed text-zinc-400">
                  {selectedBlock.description}
                </p>
              )}
            </div>

            {/* Relations */}
            {relatedRelations.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
                  Relations
                </div>
                <div className="space-y-2">
                  {relatedRelations.map((rel) => {
                    const isSource = rel.from === selectedNodeId;
                    const otherBlockId = isSource ? rel.to : rel.from;
                    const otherBlock = [
                      ...project.operationalBlocks,
                      ...project.functionalBlocks,
                    ].find((b) => b.id === otherBlockId);

                    return (
                      <div
                        key={rel.id}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/[0.03] text-sm"
                      >
                        <ArrowRight
                          className={`h-3 w-3 shrink-0 ${
                            isSource ? 'text-cyan-400' : 'text-purple-400 rotate-180'
                          }`}
                        />
                        <span className="text-zinc-500 text-xs uppercase">
                          {rel.type.replace('_', ' ')}
                        </span>
                        <span className="text-zinc-300">
                          {otherBlock?.label || otherBlockId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Children (functional blocks) */}
            {childBlocks.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
                  Functional Blocks
                </div>
                <div className="space-y-1.5">
                  {childBlocks.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/[0.03] text-sm"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background:
                            BLOCK_TYPE_COLORS[child.type] || 'hsl(215 20% 55%)',
                        }}
                      />
                      <span className="text-zinc-300">{child.label}</span>
                      <span className="text-[10px] text-zinc-600 uppercase ml-auto">
                        {child.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

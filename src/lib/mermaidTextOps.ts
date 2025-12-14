type RemoveResult = { code: string; removedCount: number };

/**
 * Removes a flowchart edge line from Mermaid code.
 * Handles cases like: C --> E[Email Verification] or C -->|label| E[Label]
 */
export function removeFlowchartEdgeLine(
  code: string,
  sourceId: string,
  targetId: string
): RemoveResult {
  const lines = code.split('\n');
  let removedCount = 0;

  const escapedSource = escapeRegex(sourceId);
  const escapedTarget = escapeRegex(targetId);
  
  // Match arrows: -->, ---, -.->, ==>, etc.
  const arrowPattern = '(?:-->|---|-\\.->|==>|--x|--o|<-->)';
  
  // Match optional edge label: |text|
  const edgeLabelPattern = '(?:\\|[^|]*\\|)?';
  
  // Match optional node shape after target ID: [Label], (Label), {Label}, ((Label)), [[Label]], >Label]
  const nodeShapePattern = '(?:\\[[^\\]]*\\]|\\([^\\)]*\\)|\\{[^}]*\\}|\\(\\([^\\)]*\\)\\)|\\[\\[[^\\]]*\\]\\]|>\\s*[^\\]]*\\])?';
  
  // Full pattern: sourceId whitespace arrow (optional |label|) whitespace targetId (optional shape)
  // Example matches: "C --> E[Email Verification]" or "B -->|New User| C[Registration]"
  const pattern = new RegExp(
    `^\\s*${escapedSource}\\s*${arrowPattern}\\s*${edgeLabelPattern}\\s*${escapedTarget}${nodeShapePattern}\\s*$`,
    'i'
  );

  const next = lines.filter((line) => {
    // Skip comments and directive lines
    const trimmed = line.trim();
    if (trimmed.startsWith('%%') || /^\s*(graph|flowchart|style|linkStyle|class|subgraph|end)\s+/i.test(trimmed)) {
      return true;
    }
    
    // Only remove the FIRST matching line
    if (removedCount === 0 && pattern.test(line)) {
      removedCount++;
      return false;
    }
    return true;
  });

  return { code: next.join('\n'), removedCount };
}

/**
 * Removes lines that reference a specific node (definition or edges).
 */
export function removeFlowchartNodeReferences(code: string, nodeId: string): RemoveResult {
  const lines = code.split('\n');
  const kept: string[] = [];
  let removedCount = 0;

  const escapedId = escapeRegex(nodeId);
  
  // Pattern for standalone node definition: nodeId[Label] or nodeId(Label) etc.
  const standaloneNodeDef = new RegExp(
    `^\\s*${escapedId}\\s*[\\[\\(\\{>].*$`
  );
  
  // Pattern for edges containing this node (as source or target)
  // Source: nodeId --> target or nodeId -->|label| target
  // Target: source --> nodeId or source -->|label| nodeId[shape]
  const arrowPattern = '(?:-->|---|-\\.->|==>|--x|--o|<-->)';
  const edgeLabelPattern = '(?:\\|[^|]*\\|)?';
  const nodeShapePattern = '(?:\\[[^\\]]*\\]|\\([^\\)]*\\)|\\{[^}]*\\}|\\(\\([^\\)]*\\)\\)|\\[\\[[^\\]]*\\]\\]|>\\s*[^\\]]*\\])?';
  
  // Match if nodeId is source: nodeId arrow ...
  const edgeWithNodeAsSource = new RegExp(
    `^\\s*${escapedId}\\s*${arrowPattern}\\s*${edgeLabelPattern}\\s*`,
    'i'
  );
  
  // Match if nodeId is target: ... arrow nodeId[shape]
  const edgeWithNodeAsTarget = new RegExp(
    `${arrowPattern}\\s*${edgeLabelPattern}\\s*${escapedId}${nodeShapePattern}\\s*$`,
    'i'
  );

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Keep directive lines and style lines
    if (trimmed.startsWith('%%') || 
        /^\s*(graph|flowchart|style|linkStyle|class|subgraph|end)\s+/i.test(trimmed)) {
      kept.push(line);
      continue;
    }
    
    // Remove standalone node definitions
    if (standaloneNodeDef.test(line)) {
      removedCount++;
      continue;
    }
    
    // Remove edges containing this node (as source or target)
    if (edgeWithNodeAsSource.test(line) || edgeWithNodeAsTarget.test(line)) {
      removedCount++;
      continue;
    }
    
    kept.push(line);
  }

  return { code: kept.join('\n'), removedCount };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

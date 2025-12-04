import { Node, Edge } from '@xyflow/react';

interface ParsedDiagram {
  nodes: Node[];
  edges: Edge[];
  direction: 'TB' | 'TD' | 'BT' | 'LR' | 'RL';
}

// Parse mermaid flowchart code into React Flow nodes and edges
export function parseMermaidToFlow(code: string): ParsedDiagram {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, { label: string; style?: Record<string, string> }>();
  const nodePositions = new Map<string, { x: number; y: number }>();
  
  let direction: ParsedDiagram['direction'] = 'TD';
  
  // First pass: find direction and collect all nodes
  for (const line of lines) {
    // Match direction
    const dirMatch = line.match(/^(?:graph|flowchart)\s+(TB|TD|BT|LR|RL)/i);
    if (dirMatch) {
      direction = dirMatch[1].toUpperCase() as ParsedDiagram['direction'];
      continue;
    }
    
    // Skip style and other directives
    if (line.startsWith('style ') || line.startsWith('linkStyle ') || 
        line.startsWith('subgraph') || line === 'end' || line.startsWith('class ')) {
      continue;
    }
    
    // Match node definitions and connections
    // Pattern: A[Label] or A([Label]) or A{Label} or A((Label)) or A>Label] or A[[Label]]
    const nodePattern = /([A-Za-z_][A-Za-z0-9_]*)\s*(\[([^\]]*)\]|\(([^)]*)\)|\{([^}]*)\}|\(\(([^)]*)\)\)|>([^\]]*)\]|\[\[([^\]]*)\]\])?/g;
    
    let match;
    while ((match = nodePattern.exec(line)) !== null) {
      const id = match[1];
      const label = match[3] || match[4] || match[5] || match[6] || match[7] || match[8] || id;
      
      if (!nodeMap.has(id) && id !== 'style' && id !== 'linkStyle' && id !== 'class') {
        nodeMap.set(id, { label: label.replace(/[🚀🎯📝🔐✅❌📊📦🌐👤⚙️🗄️💻🚪]/g, '').trim() || id });
      }
    }
  }
  
  // Second pass: find edges
  for (const line of lines) {
    if (line.startsWith('graph') || line.startsWith('flowchart') || 
        line.startsWith('style ') || line.startsWith('linkStyle ') ||
        line.startsWith('subgraph') || line === 'end') {
      continue;
    }
    
    // Match edge patterns: A --> B, A --- B, A -.-> B, A ==> B, A -->|text| B
    const edgePattern = /([A-Za-z_][A-Za-z0-9_]*)\s*(-->|---|-\.->|==>|-->\|([^|]*)\||---\|([^|]*)\||-\.->\|([^|]*)\|)\s*([A-Za-z_][A-Za-z0-9_]*)/g;
    
    let match;
    while ((match = edgePattern.exec(line)) !== null) {
      const source = match[1];
      const target = match[6];
      const label = match[3] || match[4] || match[5] || '';
      
      if (source && target && nodeMap.has(source) && nodeMap.has(target)) {
        edges.push({
          id: `${source}-${target}-${edges.length}`,
          source,
          target,
          label: label || undefined,
          type: 'step',
          animated: match[2].includes('.'),
          style: { stroke: 'hsl(var(--muted-foreground))' },
          labelStyle: { fill: 'hsl(var(--foreground))', fontSize: 12 },
        });
      }
    }
  }
  
  // Calculate positions based on graph structure
  const isHorizontal = direction === 'LR' || direction === 'RL';
  const spacing = { x: isHorizontal ? 200 : 150, y: isHorizontal ? 100 : 120 };
  
  // Simple layout: arrange nodes in a grid based on their connection depth
  const depths = new Map<string, number>();
  const visited = new Set<string>();
  
  // Find root nodes (no incoming edges)
  const hasIncoming = new Set(edges.map(e => e.target));
  const roots = Array.from(nodeMap.keys()).filter(id => !hasIncoming.has(id));
  
  // BFS to assign depths
  const queue = roots.length > 0 ? roots : [Array.from(nodeMap.keys())[0]];
  queue.forEach(id => depths.set(id, 0));
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const currentDepth = depths.get(current) || 0;
    const outgoing = edges.filter(e => e.source === current);
    
    for (const edge of outgoing) {
      if (!depths.has(edge.target)) {
        depths.set(edge.target, currentDepth + 1);
        queue.push(edge.target);
      }
    }
  }
  
  // Assign remaining nodes
  nodeMap.forEach((_, id) => {
    if (!depths.has(id)) depths.set(id, 0);
  });
  
  // Group by depth and position
  const depthGroups = new Map<number, string[]>();
  depths.forEach((depth, id) => {
    if (!depthGroups.has(depth)) depthGroups.set(depth, []);
    depthGroups.get(depth)!.push(id);
  });
  
  depthGroups.forEach((ids, depth) => {
    ids.forEach((id, index) => {
      const offset = (ids.length - 1) / 2;
      if (isHorizontal) {
        nodePositions.set(id, {
          x: depth * spacing.x + 50,
          y: (index - offset) * spacing.y + 200,
        });
      } else {
        nodePositions.set(id, {
          x: (index - offset) * spacing.x + 300,
          y: depth * spacing.y + 50,
        });
      }
    });
  });
  
  // Create nodes
  nodeMap.forEach((data, id) => {
    const pos = nodePositions.get(id) || { x: 100, y: 100 };
    nodes.push({
      id,
      position: pos,
      data: { label: data.label },
      type: 'custom',
      style: {
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '10px 16px',
        color: 'hsl(var(--foreground))',
        fontSize: '14px',
      },
    });
  });
  
  return { nodes, edges, direction };
}

// Convert React Flow nodes and edges back to Mermaid code
export function flowToMermaid(nodes: Node[], edges: Edge[], direction: string = 'TD'): string {
  let code = `flowchart ${direction}\n`;
  
  // Add node definitions
  nodes.forEach(node => {
    const label = node.data?.label || node.id;
    code += `    ${node.id}[${label}]\n`;
  });
  
  // Add edges
  edges.forEach(edge => {
    const label = edge.label ? `|${edge.label}|` : '';
    const arrow = edge.animated ? '-.->' : '-->';
    code += `    ${edge.source} ${arrow}${label} ${edge.target}\n`;
  });
  
  return code;
}

import { useMemo } from 'react';
import { sankey as d3Sankey, sankeyLinkHorizontal, type SankeyGraph, type SankeyLink as D3SankeyLink, type SankeyNode as D3SankeyNode } from 'd3-sankey';

interface SankeyNode {
  name: string;
  color: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

type GraphNode = SankeyNode & D3SankeyNode<SankeyNode, SankeyLink>;
type GraphLink = D3SankeyLink<SankeyNode, SankeyLink>;

interface Props {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width?: number;
  height?: number;
}

export const SankeyChart = ({ nodes, links, width = 600, height = 320 }: Props) => {
  const graph = useMemo(() => {
    if (nodes.length === 0 || links.filter(l => l.value > 0).length === 0) return null;
    const sankeyGen = d3Sankey<SankeyNode, SankeyLink>()
      .nodeWidth(18)
      .nodePadding(14)
      .extent([[10, 10], [width - 10, height - 10]]);
    const g: SankeyGraph<SankeyNode, SankeyLink> = {
      nodes: nodes.map(n => ({ ...n })),
      links: links.filter(l => l.value > 0).map(l => ({ ...l })),
    };
    try {
      return sankeyGen(g);
    } catch {
      return null;
    }
  }, [nodes, links, width, height]);

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">尚無資料</div>
    );
  }

  return (
    <svg width={width} height={height} className="w-full h-full">
      <g>
        {graph.links.map((link, i) => (
          <path
            key={i}
            d={sankeyLinkHorizontal<GraphNode, GraphLink>()(link as GraphLink) || ''}
            fill="none"
            stroke={((link.source as GraphNode).color)}
            strokeOpacity={0.35}
            strokeWidth={Math.max(1, link.width ?? 1)}
          />
        ))}
      </g>
      <g>
        {graph.nodes.map((node, i) => {
          const graphNode = node as GraphNode;
          return (
            <g key={i}>
              <rect
                x={graphNode.x0}
                y={graphNode.y0}
                width={(graphNode.x1 ?? 0) - (graphNode.x0 ?? 0)}
                height={Math.max(1, (graphNode.y1 ?? 0) - (graphNode.y0 ?? 0))}
                fill={graphNode.color}
                rx={3}
              />
              <text
                x={((graphNode.x1 ?? 0) < width / 2) ? (graphNode.x1 ?? 0) + 6 : (graphNode.x0 ?? 0) - 6}
                y={((graphNode.y0 ?? 0) + (graphNode.y1 ?? 0)) / 2}
                dy="0.35em"
                textAnchor={(graphNode.x1 ?? 0) < width / 2 ? 'start' : 'end'}
                fontSize={11}
                fill="#374151"
              >
                {graphNode.name}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// chartjs-chart-treenode/src/plugin.js

const treeGraphPlugin = {
  id: 'treeGraph',
  afterDraw(chart) {
    if (chart.config.type !== 'scatter') return;
    const dataset = chart.data.datasets[0];
    const links = dataset.data;
    if (!links || !Array.isArray(links)) return;

    function buildGraph(links) {
      const nodes = {};
      links.forEach(link => {
        if (!nodes[link.from]) nodes[link.from] = { label: link.from, children: [], parents: [] };
        if (!nodes[link.to]) nodes[link.to] = { label: link.to, children: [], parents: [] };
        nodes[link.from].children.push(nodes[link.to]);
        nodes[link.to].parents.push(nodes[link.from]);
      });
      return nodes;
    }

    function layoutGraphic(nodes) {
      Object.values(nodes).forEach(n => {
        n.depth = null;
        n.y = null;
      });

      const roots = Object.values(nodes).filter(n => n.parents.length === 0);
      roots.forEach(root => root.depth = 0);

      let changed;
      do {
        changed = false;
        Object.values(nodes).forEach(node => {
          if (node.parents.length === 0) return;
          const maxParentDepth = Math.max(-1, ...node.parents.map(p => p.depth ?? -1));
          const newDepth = maxParentDepth + 1;
          if (node.depth === null || node.depth < newDepth) {
            node.depth = newDepth;
            changed = true;
          }
        });
      } while (changed);

      const columnMap = dataset.column || {};
      Object.entries(nodes).forEach(([label, node]) => {
        if (columnMap[label] !== undefined) {
          node.depth = columnMap[label];
        }
      });

      const columns = new Map();
      Object.values(nodes).forEach(node => {
        if (!columns.has(node.depth)) columns.set(node.depth, []);
        columns.get(node.depth).push(node);
      });

      const maxNodesInColumn = Math.max(...[...columns.values()].map(col => col.length));

      const priorityMap = dataset.priority || {};
      columns.forEach((nodesAtDepth, depth) => {
        nodesAtDepth.sort((a, b) => {
          const aPriority = priorityMap[a.label] ?? Number.MAX_SAFE_INTEGER;
          const bPriority = priorityMap[b.label] ?? Number.MAX_SAFE_INTEGER;
          return aPriority - bPriority || a.label.localeCompare(b.label);
        });

        const spacing = 1 / (maxNodesInColumn + 1);
        const startY = (1 - spacing * (nodesAtDepth.length - 1)) / 2;
        nodesAtDepth.forEach((node, i) => node.y = startY + i * spacing);
      });

      return { maxDepth: Math.max(...Object.values(nodes).map(n => n.depth)), maxY: 1 };
    }

    const nodes = buildGraph(links);
    const { maxDepth } = layoutGraphic(nodes);
    const allNodes = Object.values(nodes);
    const ctx = chart.ctx;
    const area = chart.chartArea;

    allNodes.forEach(node => {
      const incoming = links.filter(l => l.to === node.label);
      const outgoing = links.filter(l => l.from === node.label);
      if (incoming.length > 0) {
        node.value = incoming.reduce((acc, l) => acc + l.value, 0);
      } else if (outgoing.length > 0) {
        node.value = outgoing[0].value;
      } else {
        node.value = 0;
      }
    });

    if (!chart._tooltipHandlerAttached) {
      const canvas = chart.canvas;
      chart._hoveredNode = null;
      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        chart._hoveredNode = null;
        for (const node of allNodes) {
          const { x, y } = toCanvasCoords(node.depth, node.y);
          const dx = mouseX - x;
          const dy = mouseY - y;
          if (Math.sqrt(dx * dx + dy * dy) <= 10) {
            chart._hoveredNode = node;
            break;
          }
        }
        chart.draw();
      });
      chart._tooltipHandlerAttached = true;
    }

    function toCanvasCoords(depth, y) {
      const paddingX = 50, paddingY = 40;
      const width = area.right - area.left - 2 * paddingX;
      const height = area.bottom - area.top - 2 * paddingY;
      const minY = Math.min(...allNodes.map(n => n.y));
      const maxY = Math.max(...allNodes.map(n => n.y));
      const yNorm = (y - minY) / (maxY - minY || 1);
      return {
        x: area.left + paddingX + (depth / (maxDepth || 1)) * width,
        y: area.top + paddingY + yNorm * height
      };
    }

    allNodes.forEach(node => {
      node.children.forEach(child => {
        const from = toCanvasCoords(node.depth, node.y);
        const to = toCanvasCoords(child.depth, child.y);
        ctx.save();
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const dx = (to.x - from.x) * 0.5;
        ctx.moveTo(from.x, from.y);
        ctx.bezierCurveTo(from.x + dx, from.y, to.x - dx, to.y, to.x, to.y);
        ctx.stroke();
        ctx.restore();
      });
    });

    allNodes.forEach(node => {
      const { x, y } = toCanvasCoords(node.depth, node.y);
      ctx.save();

      const nodeColors = dataset.nodeColors || {};
      const fillColor = nodeColors[node.label] || "black";

      const borderRaw = dataset.nodeBorder || "0px";
      const borderColor = dataset.nodeBorderColor || "black";
      let borderWidth = 0;
      if (typeof borderRaw === "string" && borderRaw.endsWith("px")) {
        borderWidth = parseInt(borderRaw.replace("px", ""));
      }

      if (borderWidth > 0) {
        ctx.beginPath();
        ctx.arc(x, y, 10 + borderWidth / 2, 0, 2 * Math.PI);
        ctx.fillStyle = borderColor;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#222";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(node.label, x, y + 14);
      ctx.restore();
    });

    const hovered = chart._hoveredNode;
    if (hovered) {
      const { x, y } = toCanvasCoords(hovered.depth, hovered.y);
      const text = `${hovered.label}: ${hovered.value}`;
      const padding = 6;

      ctx.save();
      ctx.font = "bold 14px sans-serif";
      const width = ctx.measureText(text).width;
      const height = 20;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(x - width / 2 - padding, y - 30, width + 2 * padding, height);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y - 20);
      ctx.restore();
    }
  }
};

if (typeof window !== 'undefined' && window.Chart) {
  window.Chart.register(treeGraphPlugin);
}

export default treeGraphPlugin;
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE = '/api';

export default function Topology() {
  const svgRef = useRef(null);
  const [topology, setTopology] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/topology`)
      .then(res => res.json())
      .then(data => {
        setTopology(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load topology:', err);
        setLoading(false);
      });
  }, []);

  // Simple force simulation after data load
  useEffect(() => {
    if (loading || !svgRef.current || topology.nodes.length === 0) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = 500;

    // Initialize node positions randomly
    const nodes = topology.nodes.map(n => ({
      ...n,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0
    }));

    const links = topology.links.map(l => ({
      ...l,
      sourceNode: nodes.find(n => n.id === l.source),
      targetNode: nodes.find(n => n.id === l.target)
    })).filter(l => l.sourceNode && l.targetNode);

    // Run simple force simulation
    const alpha = 0.3;
    const alphaDecay = 0.02;
    const alphaMin = 0.01;
    let currentAlpha = alpha;

    const repulsion = 200;
    const springLength = 120;
    const springK = 0.05;
    const damping = 0.9;

    const tick = () => {
      if (currentAlpha < alphaMin) return;

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force * currentAlpha;
          const fy = (dy / dist) * force * currentAlpha;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction along links
      links.forEach(link => {
        const s = link.sourceNode;
        const t = link.targetNode;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const force = (dist - springLength) * springK * currentAlpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      });

      // Center gravity
      const cx = width / 2, cy = height / 2;
      nodes.forEach(n => {
        n.vx += (cx - n.x) * 0.01 * currentAlpha;
        n.vy += (cy - n.y) * 0.01 * currentAlpha;
      });

      // Update positions with damping
      nodes.forEach(n => {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        // Keep within bounds
        n.x = Math.max(20, Math.min(width - 20, n.x));
        n.y = Math.max(20, Math.min(height - 20, n.y));
      });

      render();
      currentAlpha -= alphaDecay;
      if (currentAlpha >= alphaMin) {
        requestAnimationFrame(tick);
      }
    };

    const render = () => {
      // Clear previous
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      // Draw links
      links.forEach(link => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(link.sourceNode.x));
        line.setAttribute('y1', String(link.sourceNode.y));
        line.setAttribute('x2', String(link.targetNode.x));
        line.setAttribute('y2', String(link.targetNode.y));
        line.setAttribute('stroke', '#9ca3af');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', link.status === 'down' ? '4' : '0');
        svg.appendChild(line);
      });

      // Draw nodes
      nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', getNodeColor(node.type));
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '0.3em');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '10');
        text.textContent = node.type.substring(0, 3).toUpperCase();

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      });
    };

    tick();
  }, [loading, topology]);

  const getNodeColor = (type) => {
    const colors = {
      router: '#3b82f6',
      switch: '#10b981',
      server: '#8b5cf6',
      client: '#f97316',
      firewall: '#ef4444'
    };
    return colors[type] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Network Topology</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Visual representation of network devices and connections.
          </p>
        </div>

        <div className="glass-card p-4 overflow-hidden">
          <svg
            ref={svgRef}
            width="100%"
            height="500"
            viewBox="0 0 1000 500"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries({
            router: 'Router',
            switch: 'Switch',
            server: 'Server',
            client: 'Client',
            firewall: 'Firewall'
          }).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getNodeColor(type) }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useWorkStore } from '../../store/useWorkStore';
import { Network } from 'lucide-react';

export function WorkTopology() {
  const svgRef = useRef();
  const statusList = useWorkStore(state => state.networkStatus);
  const [viewMode, setViewMode] = useState('mesh'); // mesh, department, tree

  const deptColors = {
    'Tecnología': '#38bdf8', // sky-400
    'Operaciones': '#34d399', // emerald-400
    'Recursos Humanos': '#fbbf24', // amber-400
    'Dirección': '#a78bfa', // violet-400
    'Finanzas': '#fb7185', // rose-400
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height]);

    let nodes = [];
    let links = [];

    const depts = [...new Set(statusList.map(s => s.departamento))];

    if (viewMode === 'mesh') {
      nodes = statusList.map(s => ({ id: s.id, nombre: s.nombre, departamento: s.departamento, r: 8 }));
      
      // Full mesh connections logic: connect randomly
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() > 0.6) {
            links.push({ source: nodes[i].id, target: nodes[j].id, value: 1 });
          }
        }
      }
    } else if (viewMode === 'department') {
      // Hub node per department
      nodes = depts.map(d => ({ id: `hub-${d}`, nombre: d, isHub: true, departamento: d, r: 16 }));
      nodes = [...nodes, ...statusList.map(s => ({ id: s.id, nombre: s.nombre, departamento: s.departamento, r: 8 }))];
      
      // Link peers to their dept hub
      statusList.forEach(s => {
        links.push({ source: s.id, target: `hub-${s.departamento}`, value: 1 });
      });
      // Link hubs to each other
      for (let i = 0; i < depts.length; i++) {
        for (let j = i + 1; j < depts.length; j++) {
          links.push({ source: `hub-${depts[i]}`, target: `hub-${depts[j]}`, value: 2 });
        }
      }
    } else if (viewMode === 'tree') {
      // Tree logic: Central root -> Departments -> Peers
      nodes.push({ id: 'root', nombre: 'NodeMap Core', isHub: true, r: 20 });
      nodes = [...nodes, ...depts.map(d => ({ id: `hub-${d}`, nombre: d, isHub: true, departamento: d, r: 14 }))];
      nodes = [...nodes, ...statusList.map(s => ({ id: s.id, nombre: s.nombre, departamento: s.departamento, r: 8 }))];

      depts.forEach(d => links.push({ source: 'root', target: `hub-${d}`, value: 2 }));
      statusList.forEach(s => links.push({ source: `hub-${s.departamento}`, target: s.id, value: 1 }));
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(viewMode === 'tree' ? 80 : 100))
      .force("charge", d3.forceManyBody().strength(viewMode === 'tree' ? -150 : -250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => d.r + 10));

    if (viewMode === 'tree') {
      simulation.force("y", d3.forceY(d => d.id === 'root' ? height/6 : (d.isHub ? height/2 : height*0.8)).strength(0.8));
    }

    const link = svg.append("g")
      .attr("stroke", "#ffffff22")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => d.value);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.1)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.id === 'root' ? "#ffffff" : (deptColors[d.departamento] || "#888"))
      .style("filter", "drop-shadow(0px 0px 4px rgba(255,255,255,0.2))")
      .call(drag(simulation));

    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.nombre)
      .attr("font-size", d => d.isHub ? 12 : 9)
      .attr("dx", d => d.r + 5)
      .attr("dy", 4)
      .attr("fill", d => d.isHub ? "#ffffff" : "#ffffffaa")
      .attr("font-family", "monospace");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      node
        .attr("cx", d => d.x = Math.max(d.r, Math.min(width - d.r, d.x)))
        .attr("cy", d => d.y = Math.max(d.r, Math.min(height - d.r, d.y)));
      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    return () => simulation.stop();
  }, [statusList, viewMode]);

  // Statistics calculation
  const totalNodes = statusList.length;
  const totalConnections = viewMode === 'mesh' ? Math.floor(totalNodes * (totalNodes - 1) * 0.4) : (viewMode === 'department' ? totalNodes + 5 : totalNodes + 2);
  const avgDegree = totalNodes > 0 ? (totalConnections * 2 / totalNodes).toFixed(1) : 0;
  const diameter = viewMode === 'mesh' ? 2 : (viewMode === 'department' ? 3 : 4);
  const resilience = viewMode === 'mesh' ? 'Alta (Descentralizada)' : 'Media (Estructurada)';

  return (
    <div className="flex flex-col md:flex-row h-full bg-transparent relative z-10 overflow-hidden">
      
      <div className="w-full md:w-72 bg-white/[0.02] backdrop-blur-xl border-r border-white/5 p-6 flex flex-col z-20 shadow-2xl">
        <div className="flex items-center gap-2 mb-8 text-white font-medium">
          <Network className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg text-white">Topología P2P</h2>
        </div>
        
        <div className="mb-8 space-y-3">
          <label className="block text-[10px] uppercase text-zinc-500 tracking-widest font-mono">Modo de Visualización</label>
          <div className="flex flex-col gap-2">
            <button onClick={() => setViewMode('mesh')} className={`text-left px-3 py-2 text-xs font-mono rounded-md transition-all ${viewMode === 'mesh' ? 'bg-sky-500/15 text-white border border-sky-400/30 shadow-[inset_0_0_15px_rgba(56,189,248,0.15)]' : 'border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}>Mesh Completo</button>
            <button onClick={() => setViewMode('department')} className={`text-left px-3 py-2 text-xs font-mono rounded-md transition-all ${viewMode === 'department' ? 'bg-sky-500/15 text-white border border-sky-400/30 shadow-[inset_0_0_15px_rgba(56,189,248,0.15)]' : 'border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}>Por Departamento</button>
            <button onClick={() => setViewMode('tree')} className={`text-left px-3 py-2 text-xs font-mono rounded-md transition-all ${viewMode === 'tree' ? 'bg-sky-500/15 text-white border border-sky-400/30 shadow-[inset_0_0_15px_rgba(56,189,248,0.15)]' : 'border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}>Árbol Jerárquico</button>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-[10px] uppercase text-zinc-500 tracking-widest font-mono mb-4">Métricas de Red</label>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-2 rounded">
              <div className="text-zinc-500">Nodos Activos</div>
              <div className="text-sm text-white font-bold">{totalNodes}</div>
            </div>
            <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-2 rounded">
              <div className="text-zinc-500">DataChannels</div>
              <div className="text-sm text-sky-400 font-bold">{totalConnections}</div>
            </div>
            <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-2 rounded">
              <div className="text-zinc-500">Grado Promedio</div>
              <div className="text-sm text-purple-400 font-bold">{avgDegree}</div>
            </div>
            <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-2 rounded">
              <div className="text-zinc-500">Diámetro de Red</div>
              <div className="text-sm text-amber-400 font-bold">{diameter}</div>
            </div>
            <div className="flex flex-col bg-white/[0.01] border border-white/5 p-2 rounded gap-1">
              <div className="text-zinc-500">Nivel Resiliencia</div>
              <div className="text-emerald-400 truncate">{resilience}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-transparent overflow-hidden">
        {statusList.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-sm z-20 pointer-events-none">
            Esperando telemetría de peers...
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
      </div>
    </div>
  );
}

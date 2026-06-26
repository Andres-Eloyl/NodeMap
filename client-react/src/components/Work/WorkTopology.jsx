import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useWorkStore } from '../../store/useWorkStore';

export function WorkTopology() {
  const svgRef = useRef();
  const statusList = useWorkStore(state => state.networkStatus);

  useEffect(() => {
    if (!svgRef.current) return;

    // Colores de departamento
    const deptColors = {
      'Tecnología': '#3b82f6',
      'Operaciones': '#10b981',
      'Recursos Humanos': '#ec4899',
      'Dirección': '#8b5cf6',
      'Finanzas': '#f59e0b',
    };

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Limpiar SVG anterior
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Crear nodos a partir de statusList
    // Añadir un "hub" central para conectar a todos
    const nodes = [
      { id: 'hub', nombre: 'NodeMap Core', isHub: true, r: 20 },
      ...statusList.map(s => ({
        id: s.id,
        nombre: s.nombre,
        departamento: s.departamento,
        r: 10
      }))
    ];

    // Enlaces de cada nodo al hub central simulando DataChannels P2P
    const links = statusList.map(s => ({
      source: s.id,
      target: 'hub',
      value: 1
    }));

    // Añadir algunas conexiones aleatorias intra-departamento para que parezca una malla parcial
    for (let i = 0; i < statusList.length; i++) {
      for (let j = i + 1; j < statusList.length; j++) {
        if (statusList[i].departamento === statusList[j].departamento && Math.random() > 0.5) {
          links.push({ source: statusList[i].id, target: statusList[j].id, value: 0.5 });
        }
      }
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => d.r + 5));

    const link = svg.append("g")
      .attr("stroke", "#ffffff22")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => d.value * 2);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.isHub ? "#ffffff" : (deptColors[d.departamento] || "#888"))
      .call(drag(simulation));

    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.nombre)
      .attr("font-size", 10)
      .attr("dx", 15)
      .attr("dy", 4)
      .attr("fill", "#ffffff88")
      .attr("font-family", "monospace");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

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
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [statusList]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border border-white/5 relative z-10 p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-blue-400">Topología P2P Corporativa</h2>
        <div className="flex gap-4 text-[10px] font-mono text-white/50">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Tecnología</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Operaciones</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> RRHH</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500"></span> Dirección</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Finanzas</div>
        </div>
      </div>
      
      <div className="flex-1 relative border border-white/10 bg-black/50 overflow-hidden">
        {statusList.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 font-mono text-sm z-20 pointer-events-none">
            Esperando telemetría de peers...
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
      </div>
    </div>
  );
}

const PALETTE = [
    "hsl(174, 72%, 56%)",  // cyan tropical
    "hsl(262, 83%, 68%)",  // violeta eléctrico
    "hsl(338, 78%, 62%)",  // rosa magenta
    "hsl(45, 93%, 58%)",   // dorado ámbar
    "hsl(142, 69%, 52%)",  // verde esmeralda
    "hsl(199, 89%, 58%)",  // azul cielo
    "hsl(14, 90%, 62%)",   // coral cálido
    "hsl(280, 65%, 60%)",  // lila profundo
    "hsl(160, 84%, 44%)",  // turquesa
    "hsl(35, 95%, 54%)",   // naranja sunset
    "hsl(220, 80%, 62%)",  // azul real
    "hsl(350, 80%, 55%)",  // rojo rubí
];

const ZONAS = {
    "Zona A":     { x: 0.20, y: 0.30, width: 0.20, height: 0.25, color: "hsl(174,72%,56%)" },
    "Zona B":     { x: 0.50, y: 0.30, width: 0.20, height: 0.25, color: "hsl(262,83%,68%)" },
    "Zona C":     { x: 0.80, y: 0.30, width: 0.20, height: 0.25, color: "hsl(338,78%,62%)" },
    "Pasillo":    { x: 0.50, y: 0.60, width: 0.60, height: 0.10, color: "hsl(45,93%,58%)"  },
    "Escenario":  { x: 0.50, y: 0.85, width: 0.40, height: 0.15, color: "hsl(142,69%,52%)" },
    "Entrada":    { x: 0.50, y: 0.05, width: 0.15, height: 0.08, color: "hsl(199,89%,58%)" },
};
let width, height;
let svg, defs;
let simulation;
let nodeSelection, linkSelection;

let zonaRects = {};
let currentScale = 1;
let currentTx = 0;
let currentTy = 0;

let nodes = [];
let links = [];


const metrics = {
    peersActivos: 0,
    mensajesTotales: 0,
    startTime: Date.now()
};


function bumpNetworkBars() {
    const rings = document.getElementById('health-rings');
    if (rings) {
        rings.classList.add('active');
        clearTimeout(rings.activeTimer);
        rings.activeTimer = setTimeout(() => rings.classList.remove('active'), 1000);
    }
}

function randomizeNetworkBars() {
    const bars = document.querySelectorAll('#network-activity .bar');
    bars.forEach(bar => {
        const h = Math.floor(Math.random() * 60) + 40;
        bar.style.height = h + '%';
    });
}
setInterval(randomizeNetworkBars, 500);


function getPeerColorIndex(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % PALETTE.length;
}


async function initGraph() {
    const container = document.getElementById("graph-container");
    width = container.clientWidth;
    height = container.clientHeight;

    svg = d3.select("#graph-svg")
        .attr("width", width)
        .attr("height", height);

    defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "node-glow")
        .attr("x", "-50%").attr("y", "-50%")
        .attr("width", "200%").attr("height", "200%");
    
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "8")
        .attr("result", "coloredBlur");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    svg.append("g").attr("id", "recinto-layer");
    svg.append("g").attr("id", "zone-counters");
    svg.append("g").attr("id", "trails-layer");
    svg.append("g").attr("id", "hull-layer");
    svg.append("g").attr("id", "links-layer");
    svg.append("g").attr("id", "messages-layer");
    svg.append("g").attr("id", "nodes-layer");
    try {
        const xml = await d3.xml("recinto.svg");
        const importedSVG = xml.documentElement;
        const recintoLayer = svg.select("#recinto-layer");
        while (importedSVG.firstChild) {
            recintoLayer.node().appendChild(importedSVG.firstChild);
        }
    } catch (error) {
        console.warn("No se pudo cargar 'recinto.svg' (probablemente por restricciones CORS de file://). Usando plano sintético de respaldo.");
        
        const RECINTO_W = 1200;
        const RECINTO_H = 800;
        const recintoLayer = svg.select("#recinto-layer");
        recintoLayer.append("rect")
            .attr("width", RECINTO_W)
            .attr("height", RECINTO_H)
            .style("fill", "#0c0e17")
            .style("stroke", "rgba(255,255,255,0.05)")
            .style("stroke-width", "2px");
        for (let name in ZONAS) {
            const z = ZONAS[name];
            const rw = z.width * RECINTO_W;
            const rh = z.height * RECINTO_H;
            const rx = z.x * RECINTO_W - rw / 2;
            const ry = z.y * RECINTO_H - rh / 2;
            
            const group = recintoLayer.append("g").attr("data-nombre", name);
            group.append("rect")
                .attr("x", rx)
                .attr("y", ry)
                .attr("width", rw)
                .attr("height", rh)
                .attr("rx", 12)
                .attr("ry", 12)
                .style("fill", z.color)
                .style("fill-opacity", 0.08)
                .style("stroke", z.color)
                .style("stroke-opacity", 0.25)
                .style("stroke-width", "1.5px");
        }
    }
    let tooltip = d3.select("#zone-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "zone-tooltip")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("background", "rgba(10, 15, 30, 0.95)")
            .style("border", "1px solid rgba(255,255,255,0.1)")
            .style("padding", "12px")
            .style("border-radius", "8px")
            .style("color", "#fff")
            .style("font-family", "Montserrat, sans-serif")
            .style("z-index", "1000")
            .style("backdrop-filter", "blur(8px)")
            .style("box-shadow", "0 4px 15px rgba(0,0,0,0.5)");
            
        d3.select("body").append("div")
            .attr("id", "node-tooltip")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("background", "rgba(15, 20, 40, 0.95)")
            .style("border", "1px solid rgba(255,255,255,0.2)")
            .style("padding", "14px")
            .style("border-radius", "10px")
            .style("color", "#fff")
            .style("font-family", "Montserrat, sans-serif")
            .style("z-index", "1000")
            .style("backdrop-filter", "blur(10px)")
            .style("box-shadow", "0 4px 20px rgba(0,0,0,0.6)")
            .style("transform", "scale(0.95)")
            .style("transition", "opacity 0.2s ease, transform 0.2s ease");
    }
    d3.selectAll("#recinto-layer g[data-nombre]").each(function() {
        const group = d3.select(this);
        const rect = group.select("rect");
        if (rect.empty()) return;

        const nombre = group.attr("data-nombre");
        
        zonaRects[nombre] = {
            x: +rect.attr("x"),
            y: +rect.attr("y"),
            width: +rect.attr("width"),
            height: +rect.attr("height")
        };
        group.style("cursor", "pointer")
            .on("mouseenter", function(event) {
                rect.transition().duration(200).style("fill-opacity", 0.12);
                
                const peers = nodes.filter(n => n.zona === nombre);
                const names = peers.map(p => p.nombre).join("<br>");
                
                tooltip.html(`
                    <div style="font-weight: 600; margin-bottom: 6px; color: ${ZONAS[nombre]?.color || '#fff'}">${nombre}</div>
                    <div style="font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: ${peers.length ? '6px' : '0'}">Peers conectados: ${peers.length}</div>
                    ${peers.length > 0 ? `<div style="font-size: 11px; color: rgba(255,255,255,0.5); max-height: 150px; overflow-y: hidden;">${names}</div>` : ''}
                `);
                
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.style("left", (event.pageX + 20) + "px")
                       .style("top", (event.pageY + 20) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 20) + "px")
                       .style("top", (event.pageY + 20) + "px");
            })
            .on("mouseleave", function() {
                rect.transition().duration(200).style("fill-opacity", 0.08); // opacidad base del recinto.svg
                tooltip.transition().duration(200).style("opacity", 0);
            });
    });

    updateRecintoScale();
    initZoneCounters();

    nodeSelection = svg.select("#nodes-layer").selectAll(".node");
    linkSelection = svg.select("#links-layer").selectAll(".link");
    simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-180))
        .force("link", d3.forceLink(links).id(d => d.id).distance(120).strength(0.4))
        .force("collide", d3.forceCollide().radius(d => d.radius + 12))
        .force("x", d3.forceX(d => getZoneCenter(d.zona).x).strength(0.05))
        .force("y", d3.forceY(d => getZoneCenter(d.zona).y).strength(0.05))
        .on("tick", ticked);
    window.addEventListener('resize', onResize);
}

function updateRecintoScale() {
    const RECINTO_W = 1200;
    const RECINTO_H = 800;
    
    currentScale = Math.min((width - 40) / RECINTO_W, (height - 40) / RECINTO_H);
    currentTx = (width - RECINTO_W * currentScale) / 2;
    currentTy = (height - RECINTO_H * currentScale) / 2;
    
    svg.select("#recinto-layer")
       .attr("transform", `translate(${currentTx}, ${currentTy}) scale(${currentScale})`);
       
    updateZoneCountersPos();
}

function initZoneCounters() {
    const countersLayer = svg.select("#zone-counters");
    countersLayer.selectAll("*").remove();
    
    for (let zoneName in zonaRects) {
        const g = countersLayer.append("g").attr("id", `counter-group-${zoneName.replace(/ /g, '-')}`);
        
        g.append("rect")
            .attr("class", "counter-bg")
            .attr("rx", 6)
            .attr("ry", 6)
            .style("fill", "rgba(0, 0, 0, 0.6)");
            
        g.append("text")
            .attr("class", "counter-text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("font-family", "Montserrat, monospace")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", ZONAS[zoneName]?.color || "#fff")
            .text("0");
    }
    updateZoneCountersPos();
}

function updateZoneCountersPos() {
    for (let zoneName in zonaRects) {
        const z = zonaRects[zoneName];
        if (!z) continue;
        
        const px = (z.x + z.width) * currentScale + currentTx;
        const py = z.y * currentScale + currentTy;
        
        const g = svg.select(`#counter-group-${zoneName.replace(/ /g, '-')}`);
        if (!g.empty()) {
            g.attr("transform", `translate(${px - 20}, ${py + 20})`);
            const bg = g.select("rect");
            bg.attr("x", -15).attr("y", -15).attr("width", 30).attr("height", 30);
        }
    }
}


function onResize() {
    const container = document.getElementById("graph-container");
    width = container.clientWidth;
    height = container.clientHeight;
    svg.attr("width", width).attr("height", height);
    
    updateRecintoScale();
    
    simulation.force("x", d3.forceX(d => getZoneCenter(d.zona).x).strength(0.05));
    simulation.force("y", d3.forceY(d => getZoneCenter(d.zona).y).strength(0.05));
    simulation.alpha(0.3).restart();
}

function getZoneCenter(zoneName) {
    const z = zonaRects[zoneName];
    if (!z) return { x: width / 2, y: height / 2 };
    
    return {
        x: (z.x + z.width / 2) * currentScale + currentTx,
        y: (z.y + z.height / 2) * currentScale + currentTy
    };
}


function renderLinks() {
    linkSelection = svg.select("#links-layer").selectAll(".link")
        .data(links, d => {
            const sId = typeof d.source === "object" ? d.source.id : d.source;
            const tId = typeof d.target === "object" ? d.target.id : d.target;
            return sId + "-" + tId;
        });

    linkSelection.exit()
        .transition().duration(400)
        .style("stroke-opacity", 0)
        .remove();

    const linkEnter = linkSelection.enter()
        .append("line")
        .attr("class", "link")
        .style("stroke", "#ffffff")
        .style("stroke-opacity", 0)
        .style("stroke-width", "1px");

    linkEnter.transition().duration(600)
        .style("stroke-opacity", 0.06);

    linkSelection = linkEnter.merge(linkSelection);
}

function renderNodes() {
    nodeSelection = svg.select("#nodes-layer").selectAll(".node")
        .data(nodes, d => d.id);
    const nodeExit = nodeSelection.exit();
    nodeExit.select(".node-scale")
        .transition().duration(400).ease(d3.easeCubicIn)
        .attr("transform", "scale(0)");
    nodeExit.transition().duration(400).remove();
    const nodeEnter = nodeSelection.enter().append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const nodeTooltip = d3.select("#node-tooltip");
    
    nodeEnter.on("mouseenter", function(event, d) {
        const engine = window.MockWebRTC || window.WebRTCEngine;
        const lat = engine && engine.getLatency ? engine.getLatency(d.id) : null;
        const uptimeSegundos = Math.floor((Date.now() - (d.joinTime || Date.now())) / 1000);
        const m = Math.floor(uptimeSegundos / 60);
        const s = uptimeSegundos % 60;
        const uptimeStr = `${m}m ${s}s`;
        
        nodeTooltip.html(`
            <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${d.color}; box-shadow: 0 0 8px ${d.color}"></div>
                ${d.nombre}
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 4px;">Zona: <span style="color: #fff">${d.zona}</span></div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 4px;">Conectado: <span style="color: #fff">${uptimeStr}</span></div>
            ${lat ? `<div style="font-size: 12px; color: rgba(255,255,255,0.7);">Latencia: <span style="color: ${lat > 200 ? 'hsl(45, 93%, 58%)' : 'hsl(142, 69%, 52%)'}">${lat}ms</span></div>` : ''}
        `);
        
        nodeTooltip.style("opacity", 1)
                   .style("transform", "scale(1)")
                   .style("left", (event.pageX + 20) + "px")
                   .style("top", (event.pageY + 20) + "px");
    })
    .on("mousemove", function(event) {
        nodeTooltip.style("left", (event.pageX + 20) + "px")
                   .style("top", (event.pageY + 20) + "px");
    })
    .on("mouseleave", function() {
        nodeTooltip.style("opacity", 0).style("transform", "scale(0.95)");
    });
    const nodeScale = nodeEnter.append("g")
        .attr("class", "node-scale")
        .attr("transform", "scale(0)");
    nodeScale.append("circle")
        .attr("class", "pulse-circle")
        .attr("r", d => d.radius + 4)
        .style("fill", "none")
        .style("stroke", d => d.color)
        .style("stroke-opacity", 0.15)
        .style("animation", "node-pulse-intense 3s forwards, node-pulse 2s infinite 3s");
    nodeScale.append("circle")
        .attr("class", "main-circle")
        .attr("r", d => d.radius)
        .style("fill", d => `url(#grad-${d.colorIndex})`)
        .style("stroke", d => d.color)
        .style("stroke-opacity", 0.6)
        .style("stroke-width", "2px")
        .style("filter", "url(#node-glow)");
    nodeScale.append("text")
        .attr("dy", d => d.radius + 16)
        .style("font-family", "Montserrat, sans-serif")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .style("fill", "rgba(255, 255, 255, 0.85)")
        .style("text-anchor", "middle")
        .style("text-shadow", "0px 2px 4px rgba(0,0,0,0.8)")
        .text(d => d.nombre);
    nodeScale.transition().duration(600).ease(d3.easeBounceOut)
        .attr("transform", "scale(1)");

    nodeSelection = nodeEnter.merge(nodeSelection);
}


function drawHulls() {
    const hullsData = [];
    for (let zoneName in zonaRects) {
        const zoneNodes = nodes.filter(n => n.zona === zoneName);
        if (zoneNodes.length >= 2) {
            const points = zoneNodes.map(n => [n.x, n.y]);
            let pathStr = "";
            if (points.length === 2) {
                pathStr = `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]}`;
            } else {
                const hull = d3.polygonHull(points);
                if (hull) {
                    pathStr = "M" + hull.join("L") + "Z";
                } else {
                    pathStr = `M${points[0][0]},${points[0][1]} L${points[points.length-1][0]},${points[points.length-1][1]}`;
                }
            }
            hullsData.push({
                zone: zoneName,
                path: pathStr,
                color: ZONAS[zoneName]?.color || "#fff"
            });
        }
    }
    
    const hullSelection = svg.select("#hull-layer").selectAll("path.zone-hull").data(hullsData, d => d.zone);
    
    hullSelection.enter().append("path")
        .attr("class", "zone-hull")
        .style("fill", d => d.color)
        .style("fill-opacity", 0.04)
        .style("stroke", d => d.color)
        .style("stroke-opacity", 0.1)
        .style("stroke-width", "45px")
        .style("stroke-linejoin", "round")
        .style("pointer-events", "none")
        .merge(hullSelection)
        .attr("d", d => d.path);
        
    hullSelection.exit().remove();
}

function ticked() {
    linkSelection
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    nodeSelection
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
        
    drawHulls();
}


function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}


function addLogEntry(textHTML, typeClass) {
    const container = document.getElementById("log-entries-container");
    if (!container) return;

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const entry = document.createElement("div");
    entry.className = `log-entry type-${typeClass}`;
    entry.innerHTML = `
        <div class="log-time">${timeStr}</div>
        <div class="log-content">${textHTML}</div>
    `;

    container.insertBefore(entry, container.firstChild);

    while (container.children.length > 15) {
        container.removeChild(container.lastChild);
    }
}


function updateMetricsDisplay() {
    metrics.peersActivos = nodes.length;
}

function checkEmptyState() {
    const emptyState = document.getElementById("empty-state");
    if (!emptyState) return;
    if (nodes.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
    }
}


function addNode(peer, isOriginal = false) {
    if (nodes.find(n => n.id === peer.id)) return;

    const colorIndex = getPeerColorIndex(peer.id);
    const newNode = {
        id: peer.id,
        nombre: peer.nombre,
        zona: peer.zona,
        colorIndex: colorIndex,
        color: PALETTE[colorIndex],
        radius: isOriginal ? 22 : 18,
        x: width / 2, // Se sobreescribe abajo
        y: height / 2,
        joinTime: Date.now()
    };

    nodes.push(newNode);
    checkEmptyState();
    
    const targetPos = getZoneTarget(newNode);
    newNode.x = targetPos.x;
    newNode.y = targetPos.y;
    nodes.forEach(existing => {
        if (existing.id !== newNode.id) {
            links.push({ source: newNode.id, target: existing.id });
        }
    });

    renderLinks();
    renderNodes();

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(0.3).restart();
    
    updateZoneCounters();
    nodes.filter(n => n.zona === newNode.zona && n.id !== newNode.id).forEach(n => {
        if (typeof animateNodeToZoneTarget === "function") animateNodeToZoneTarget(n);
    });
}

function removeNode(id) {
    const nodeToRemove = nodes.find(n => n.id === id);
    if (!nodeToRemove) return;
    
    const zonaAfectada = nodeToRemove.zona;

    nodes = nodes.filter(n => n.id !== id);
    links = links.filter(l => {
        const sId = typeof l.source === "object" ? l.source.id : l.source;
        const tId = typeof l.target === "object" ? l.target.id : l.target;
        return sId !== id && tId !== id;
    });
    renderLinks();
    renderNodes();

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(0.3).restart();
    
    updateZoneCounters();
}


function updateZoneCounters() {
    for (let zoneName in zonaRects) {
        const count = nodes.filter(n => n.zona === zoneName).length;
        const g = svg.select(`#counter-group-${zoneName.replace(/ /g, '-')}`);
        if (!g.empty()) {
            const textEl = g.select("text");
            if (textEl.text() != count) {
                textEl.text(count);
                textEl.transition().duration(150)
                    .style("font-size", "20px")
                    .style("filter", "brightness(1.5)")
                    .transition().duration(150)
                    .style("font-size", "16px")
                    .style("filter", "brightness(1)");
            }
        }
    }
}

function getZoneTarget(node) {
    const z = zonaRects[node.zona];
    if (!z) return { x: width / 2, y: height / 2 };
    
    const nodesInZone = nodes.filter(n => n.zona === node.zona);
    const index = nodesInZone.indexOf(node);
    const total = nodesInZone.length;
    
    const cx = (z.x + z.width / 2) * currentScale + currentTx;
    const cy = (z.y + z.height / 2) * currentScale + currentTy;
    const rw = (z.width * currentScale) - (60 * currentScale); 
    const rh = (z.height * currentScale) - (60 * currentScale);
    
    if (total === 1) return { x: cx, y: cy };
    if (total === 2) {
        return index === 0 ? { x: cx - rw/4, y: cy } : { x: cx + rw/4, y: cy };
    }
    if (total === 3) {
        if (index === 0) return { x: cx, y: cy - rh/4 };
        if (index === 1) return { x: cx - rw/4, y: cy + rh/4 };
        if (index === 2) return { x: cx + rw/4, y: cy + rh/4 };
    }
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const stepX = rw / Math.max(1, cols - 1);
    const stepY = rh / Math.max(1, rows - 1);
    
    const startX = cx - rw/2;
    const startY = cy - rh/2;
    
    return { 
        x: startX + col * stepX, 
        y: startY + row * stepY 
    };
}

function changeNodeZone(node, newZone) {
    const oldZone = node.zona;
    if (oldZone === newZone) return;
    
    node.zona = newZone;
    node.color = ZONAS[newZone]?.color || "#ffffff"; // Actualizar color al recibir zona real
    updateZoneCounters();
    
    const oldCenter = getZoneCenter(oldZone);
    const targetPos = getZoneTarget(node);
    const animGroup = svg.select("#trails-layer").append("g");
    let pathData = "";
    if (oldZone !== "Pasillo" && newZone !== "Pasillo" && Math.abs(oldCenter.x - targetPos.x) > 300 * currentScale) {
        const pasilloCenter = getZoneCenter("Pasillo");
        pathData = `M${oldCenter.x},${oldCenter.y} Q${oldCenter.x},${pasilloCenter.y} ${pasilloCenter.x},${pasilloCenter.y} T${targetPos.x},${targetPos.y}`;
    } else {
        const mx = (oldCenter.x + targetPos.x) / 2;
        const my = (oldCenter.y + targetPos.y) / 2;
        let dx = targetPos.x - oldCenter.x;
        let dy = targetPos.y - oldCenter.y;
        const plen = Math.sqrt(dx*dx + dy*dy);
        
        let cx = mx, cy = my;
        if (plen > 0) {
            let px = -dy / plen;
            let py = dx / plen;
            const offset = (Math.random() * 40 + 40) * (Math.random() > 0.5 ? 1 : -1);
            cx = mx + px * offset;
            cy = my + py * offset;
        }
        pathData = `M${oldCenter.x},${oldCenter.y} Q${cx},${cy} ${targetPos.x},${targetPos.y}`;
    }

    const pathEl = animGroup.append("path")
        .attr("d", pathData)
        .style("fill", "none")
        .style("stroke", node.color)
        .style("stroke-width", "2px")
        .style("stroke-opacity", 0.25);
        
    const pathLen = pathEl.node().getTotalLength();
    pathEl.attr("stroke-dasharray", pathLen + " " + pathLen)
          .attr("stroke-dashoffset", pathLen)
          .transition().duration(1000).ease(d3.easeCubicInOut)
          .attr("stroke-dashoffset", 0)
          .transition().delay(4000).duration(1000).ease(d3.easeLinear)
          .style("stroke-opacity", 0)
          .remove();
    nodes.filter(n => n.zona === oldZone).forEach(n => animateNodeToZoneTarget(n));
    nodes.filter(n => n.zona === newZone).forEach(n => animateNodeToZoneTarget(n, n.id === node.id));
    simulation.alphaTarget(0.1).restart();
    setTimeout(() => simulation.alphaTarget(0), 1000);
}

function animateNodeToZoneTarget(n, isMainNode = false) {
    const target = getZoneTarget(n);
    const dummy = { t: 0 };
    const sx = n.x, sy = n.y;
    
    n.fx = sx; 
    n.fy = sy;
    
    if (isMainNode) {
        const nEl = svg.select("#nodes-layer").selectAll(".node").filter(d => d.id === n.id);
        nEl.transition().duration(500).style("opacity", 0.6)
           .transition().duration(500).style("opacity", 1.0)
           .on("end", () => {
               nEl.select(".node-scale").transition().duration(150).attr("transform", "scale(1.3)")
                  .transition().duration(150).attr("transform", "scale(1)");
           });
    }
    
    d3.select(dummy).transition().duration(1000).ease(d3.easeCubicInOut)
        .tween("move", () => {
            return function(t) {
                n.fx = sx + (target.x - sx) * t;
                n.fy = sy + (target.y - sy) * t;
            };
        })
        .on("end", () => {
            n.fx = null;
            n.fy = null;
            simulation.force("x", d3.forceX(d => getZoneCenter(d.zona).x).strength(0.05));
            simulation.force("y", d3.forceY(d => getZoneCenter(d.zona).y).strength(0.05));
            simulation.alpha(0.3).restart();
        });
}


let activeAnimations = [];

function animateChat(sourceNode, targetNode) {
    const sEl = svg.select("#nodes-layer").selectAll(".node").filter(d => d.id === sourceNode.id);
    sEl.classed("active-breathing", true);
    clearTimeout(sourceNode.breatheTimer);
    sourceNode.breatheTimer = setTimeout(() => {
        sEl.classed("active-breathing", false);
    }, 10000);

    const animGroup = svg.select("#messages-layer").append("g").attr("class", "chat-anim");
    
    activeAnimations.push(animGroup);
    if (activeAnimations.length > 5) {
        const old = activeAnimations.shift();
        old.remove();
    }
    const sx = sourceNode.x, sy = sourceNode.y;
    const tx = targetNode.x, ty = targetNode.y;
    
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    
    let dx = tx - sx;
    let dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let px = -dy;
    let py = dx;
    const plen = Math.sqrt(px * px + py * py);
    
    let cx = mx;
    let cy = my;
    if (plen > 0) {
        px /= plen;
        py /= plen;
        const offset = (Math.random() * 30 + 50) * (Math.random() > 0.5 ? 1 : -1);
        cx = mx + px * offset;
        cy = my + py * offset;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`);
    const pathLength = path.getTotalLength();
    const duration = Math.max(800, Math.min(1200, dist * 2));
    const trail = animGroup.append("circle")
        .attr("r", 10)
        .style("fill", sourceNode.color)
        .style("opacity", 0.2)
        .style("filter", "blur(4px)");
    const bullet = animGroup.append("circle")
        .attr("r", 6)
        .style("fill", sourceNode.color)
        .style("filter", "url(#node-glow)");
    const tweenPath = function() {
        return function(t) {
            const p = path.getPointAtLength(t * pathLength);
            d3.select(this).attr("cx", p.x).attr("cy", p.y);
        };
    };
    bullet.transition().duration(duration).ease(d3.easeCubicInOut)
        .tween("pathTween", tweenPath)
        .on("end", function() {
            d3.select(this).remove();
            createImpactEffect(sourceNode, targetNode);
        });
    trail.transition().delay(100).duration(duration).ease(d3.easeCubicInOut)
        .tween("pathTween", tweenPath)
        .on("end", function() {
            animGroup.remove();
            activeAnimations = activeAnimations.filter(a => a.node() !== animGroup.node());
        });
}

function createImpactEffect(sourceNode, targetNode) {
    const wave = svg.select("#messages-layer").append("circle")
        .attr("cx", targetNode.x)
        .attr("cy", targetNode.y)
        .attr("r", targetNode.radius)
        .style("fill", "none")
        .style("stroke", sourceNode.color)
        .style("stroke-width", "2px")
        .style("opacity", 0.5);

    wave.transition().duration(500).ease(d3.easeQuadOut)
        .attr("r", targetNode.radius + 30)
        .style("opacity", 0)
        .remove();
    const targetEl = svg.select("#nodes-layer").selectAll(".node").filter(d => d.id === targetNode.id).select(".node-scale");
    if (!targetEl.empty()) {
        targetEl.transition().duration(150)
            .attr("transform", "scale(1.15)")
            .transition().duration(150)
            .attr("transform", "scale(1)");
    }
    const linkEl = svg.select("#links-layer").selectAll(".link").filter(d => 
        (d.source.id === sourceNode.id && d.target.id === targetNode.id) ||
        (d.source.id === targetNode.id && d.target.id === sourceNode.id)
    );
    
    if (!linkEl.empty()) {
        linkEl.transition().duration(300)
            .style("stroke-opacity", 0.4)
            .style("stroke", sourceNode.color)
            .transition().duration(300)
            .style("stroke-opacity", 0.06)
            .style("stroke", "#ffffff");
    }
}


function setupEventListeners() {
    const IS_MOCK = !window.WebRTCEngine;
    const engine = window.WebRTCEngine || window.MockWebRTC;
    
    if (!engine) {
        console.error("Motor WebRTC no encontrado.");
        return;
    }

    engine.onMessage('peer-join', (data) => {
        bumpNetworkBars();
        addNode(data, false);
        addLogEntry(`<strong>${data.nombre}</strong> se unió a la red`, "join");
    });
    engine.onMessage('peer-leave', (data) => {
        bumpNetworkBars();
        const node = nodes.find(n => n.id === data.id);
        if (node) addLogEntry(`<strong>${node.nombre}</strong> perdió conexión`, "leave");
        removeNode(data.id);
    });
    engine.onMessage('peer-exit', (data) => {
        bumpNetworkBars();
        addLogEntry(`<strong>${data.nombre || 'Un peer'}</strong> salió de la red`, "leave");
        removeNode(data.id);
    });
    
    engine.onMessage('chat', (data) => {
        bumpNetworkBars();
        metrics.mensajesTotales++;
        const source = nodes.find(n => n.id === data.id);
        const target = nodes.find(n => n.id === data.destino);
        
        if (source && target) {
            animateChat(source, target);
            addLogEntry(`<strong>${source.nombre}</strong> → <strong>${target.nombre}</strong>: "${data.texto}"`, "msg");
        }
    });
    engine.onMessage('position', (data) => {
        bumpNetworkBars();
        const node = nodes.find(n => n.id === data.id);
        if (node) {
            changeNodeZone(node, data.zona);
            addLogEntry(`<strong>${node.nombre}</strong> se movió a <strong>${data.zona}</strong>`, "zone");
        }
    });
}


function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

let serverConnected = false;
let lastServerLogTimestamp = 0;

function updateMetricsDisplay() {
    if (!serverConnected) {
        metrics.peersActivos = nodes.length;
        const uptimeStr = formatUptime(Date.now() - metrics.startTime);
        const hp = document.getElementById('header-peer-count');
        if (hp && hp.innerText != metrics.peersActivos) {
            hp.innerText = metrics.peersActivos;
            d3.select(hp).transition().duration(150).style("transform", "scale(1.3)").transition().duration(150).style("transform", "scale(1)");
        }
        
        const hm = document.getElementById('header-message-count');
        if (hm && hm.innerText != metrics.mensajesTotales) {
            hm.innerText = metrics.mensajesTotales;
        }
        
        const hu = document.getElementById('header-uptime');
        if (hu) hu.innerText = uptimeStr;
        const tp = document.getElementById('peer-count');
        if (tp) tp.innerText = metrics.peersActivos;
        
        const tm = document.getElementById('message-count');
        if (tm) tm.innerText = metrics.mensajesTotales;
        
        const tu = document.getElementById('uptime-display');
        if (tu) tu.innerText = uptimeStr;
    }
    const engine = window.MockWebRTC || window.WebRTCEngine;
    const tl = document.getElementById('latency-display');
    if (engine && tl) {
        const currentPeers = engine.getPeers();
        let sum = 0;
        let count = 0;
        currentPeers.forEach(p => {
            const l = engine.getLatency(p.id);
            if (l !== null) { sum += l; count++; }
        });
        const avg = count > 0 ? Math.round(sum / count) : 0;
        tl.innerText = avg;
    }
    const tz = document.getElementById('zones-display');
    if (tz) {
        const activeZones = new Set(nodes.map(n => n.zona)).size;
        tz.innerText = activeZones;
    }
}
setInterval(updateMetricsDisplay, 1000);

async function fetchServerMetrics() {
    try {
        const response = await fetch("/metrics");
        if (response.ok) {
            const data = await response.json();
            serverConnected = true;
            const sd = document.getElementById('server-dot');
            const st = document.getElementById('server-text');
            if (sd && st) {
                sd.style.background = 'var(--color-success)';
                sd.style.boxShadow = '0 0 8px var(--color-success)';
                st.innerText = 'Servidor conectado';
            }
            
            metrics.peersActivos = data.peers_activos;
            metrics.mensajesTotales = data.mensajes_totales;
            const hp = document.getElementById('header-peer-count');
            if (hp && hp.innerText != metrics.peersActivos) {
                hp.innerText = metrics.peersActivos;
                d3.select(hp).transition().duration(150).style("transform", "scale(1.3)").transition().duration(150).style("transform", "scale(1)");
            }
            const tp = document.getElementById('peer-count');
            if (tp) tp.innerText = metrics.peersActivos;
            const hm = document.getElementById('header-message-count');
            if (hm && hm.innerText != metrics.mensajesTotales) {
                hm.innerText = metrics.mensajesTotales;
            }
            const tm = document.getElementById('message-count');
            if (tm) tm.innerText = metrics.mensajesTotales;
            const uptimeStr = formatUptime(data.uptime_segundos * 1000);
            const hu = document.getElementById('header-uptime');
            if (hu) hu.innerText = uptimeStr;
            const tu = document.getElementById('uptime-display');
            if (tu) tu.innerText = uptimeStr;
            if (data.log && Array.isArray(data.log)) {
                data.log.forEach(entry => {
                    if (entry.timestamp > lastServerLogTimestamp) {
                        lastServerLogTimestamp = entry.timestamp;
                        
                        let type = "info";
                        const txt = entry.evento.toLowerCase();
                        if (txt.includes("entró")) type = "join";
                        else if (txt.includes("salió") || txt.includes("desconectó")) type = "leave";
                        else if (txt.includes("cambió")) type = "zone";
                        else if (txt.includes("mensaje")) type = "msg";
                        
                        addLogEntry(entry.evento, type);
                    }
                });
            }
        } else {
            throw new Error("HTTP error");
        }
    } catch (e) {
        serverConnected = false;
        const sd = document.getElementById('server-dot');
        const st = document.getElementById('server-text');
        if (sd && st) {
            sd.style.background = 'var(--color-danger)';
            sd.style.boxShadow = '0 0 8px var(--color-danger)';
            st.innerText = 'Servidor no disponible';
        }
    }
}
setInterval(fetchServerMetrics, 2000);

function initParticles() {
    const container = document.getElementById("graph-container");
    const canvas = document.createElement("canvas");
    canvas.id = "particles-bg";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    canvas.style.pointerEvents = "none";
    container.prepend(canvas);
    
    const ctx = canvas.getContext("2d");
    const particles = [];
    
    const resize = () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.05 + 0.02
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
            }
            ctx.beginPath();
        bumpNetworkBars();
        addLogEntry(`<strong>${data.nombre || 'Un peer'}</strong> salió de la red`, "leave");
        removeNode(data.id);
    });
    
    engine.onMessage('chat', (data) => {
        bumpNetworkBars();
        metrics.mensajesTotales++;
        const source = nodes.find(n => n.id === data.id);
        const target = nodes.find(n => n.id === data.destino);
        
        if (source && target) {
            animateChat(source, target);
            addLogEntry(`<strong>${source.nombre}</strong> → <strong>${target.nombre}</strong>: "${data.texto}"`, "msg");
        }
    });
    engine.onMessage('position', (data) => {
        bumpNetworkBars();
        const node = nodes.find(n => n.id === data.id);
        if (node) {
            changeNodeZone(node, data.zona);
            addLogEntry(`<strong>${node.nombre}</strong> se movió a <strong>${data.zona}</strong>`, "zone");
        }
    });
}


function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

let serverConnected = false;
let lastServerLogTimestamp = 0;

function updateMetricsDisplay() {
    if (!serverConnected) {
        metrics.peersActivos = nodes.length;
        const uptimeStr = formatUptime(Date.now() - metrics.startTime);
        const hp = document.getElementById('header-peer-count');
        if (hp && hp.innerText != metrics.peersActivos) {
            hp.innerText = metrics.peersActivos;
            d3.select(hp).transition().duration(150).style("transform", "scale(1.3)").transition().duration(150).style("transform", "scale(1)");
        }
        
        const hm = document.getElementById('header-message-count');
        if (hm && hm.innerText != metrics.mensajesTotales) {
            hm.innerText = metrics.mensajesTotales;
        }
        
        const hu = document.getElementById('header-uptime');
        if (hu) hu.innerText = uptimeStr;
        const tp = document.getElementById('peer-count');
        if (tp) tp.innerText = metrics.peersActivos;
        
        const tm = document.getElementById('message-count');
        if (tm) tm.innerText = metrics.mensajesTotales;
        
        const tu = document.getElementById('uptime-display');
        if (tu) tu.innerText = uptimeStr;
    }
    const engine = window.MockWebRTC || window.WebRTCEngine;
    const tl = document.getElementById('latency-display');
    if (engine && tl) {
        const currentPeers = engine.getPeers();
        let sum = 0;
        let count = 0;
        currentPeers.forEach(p => {
            const l = engine.getLatency(p.id);
            if (l !== null) { sum += l; count++; }
        });
        const avg = count > 0 ? Math.round(sum / count) : 0;
        tl.innerText = avg;
    }
    const tz = document.getElementById('zones-display');
    if (tz) {
        const activeZones = new Set(nodes.map(n => n.zona)).size;
        tz.innerText = activeZones;
    }
}
setInterval(updateMetricsDisplay, 1000);

async function fetchServerMetrics() {
    try {
        const response = await fetch("/metrics");
        if (response.ok) {
            const data = await response.json();
            serverConnected = true;
            const sd = document.getElementById('server-dot');
            const st = document.getElementById('server-text');
            if (sd && st) {
                sd.style.background = 'var(--color-success)';
                sd.style.boxShadow = '0 0 8px var(--color-success)';
                st.innerText = 'Servidor conectado';
            }
            
            metrics.peersActivos = data.peers_activos;
            metrics.mensajesTotales = data.mensajes_totales;
            const hp = document.getElementById('header-peer-count');
            if (hp && hp.innerText != metrics.peersActivos) {
                hp.innerText = metrics.peersActivos;
                d3.select(hp).transition().duration(150).style("transform", "scale(1.3)").transition().duration(150).style("transform", "scale(1)");
            }
            const tp = document.getElementById('peer-count');
            if (tp) tp.innerText = metrics.peersActivos;
            const hm = document.getElementById('header-message-count');
            if (hm && hm.innerText != metrics.mensajesTotales) {
                hm.innerText = metrics.mensajesTotales;
            }
            const tm = document.getElementById('message-count');
            if (tm) tm.innerText = metrics.mensajesTotales;
            const uptimeStr = formatUptime(data.uptime_segundos * 1000);
            const hu = document.getElementById('header-uptime');
            if (hu) hu.innerText = uptimeStr;
            const tu = document.getElementById('uptime-display');
            if (tu) tu.innerText = uptimeStr;
            if (data.log && Array.isArray(data.log)) {
                data.log.forEach(entry => {
                    if (entry.timestamp > lastServerLogTimestamp) {
                        lastServerLogTimestamp = entry.timestamp;
                        
                        let type = "info";
                        const txt = entry.evento.toLowerCase();
                        if (txt.includes("entró")) type = "join";
                        else if (txt.includes("salió") || txt.includes("desconectó")) type = "leave";
                        else if (txt.includes("cambió")) type = "zone";
                        else if (txt.includes("mensaje")) type = "msg";
                        
                        addLogEntry(entry.evento, type);
                    }
                });
            }
        } else {
            throw new Error("HTTP error");
        }
    } catch (e) {
        serverConnected = false;
        const sd = document.getElementById('server-dot');
        const st = document.getElementById('server-text');
        if (sd && st) {
            sd.style.background = 'var(--color-danger)';
            sd.style.boxShadow = '0 0 8px var(--color-danger)';
            st.innerText = 'Servidor no disponible';
        }
    }
}
setInterval(fetchServerMetrics, 2000);

function initParticles() {
    const container = document.getElementById("graph-container");
    const canvas = document.createElement("canvas");
    canvas.id = "particles-bg";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    canvas.style.pointerEvents = "none";
    container.prepend(canvas);
    
    const ctx = canvas.getContext("2d");
    const particles = [];
    
    const resize = () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.05 + 0.02
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

async function init() {
    initParticles();
    await initGraph();
    const canUseReal = window.WebRTCEngine && typeof io !== "undefined";
    const IS_MOCK = !canUseReal;
    const engine = canUseReal ? window.WebRTCEngine : window.MockWebRTC;
    if (!engine) return;
    const badgeContainer = document.getElementById("mode-badge");
    if (badgeContainer) {
        if (IS_MOCK) {
            badgeContainer.innerHTML = `<span style="font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.5); letter-spacing: 1px; font-family: 'Montserrat', monospace;">SIMULACIÓN</span>`;
        } else {
            badgeContainer.innerHTML = `<span style="font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); letter-spacing: 1px; font-family: 'Montserrat', monospace; display: flex; align-items: center; gap: 6px;"><div style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 8px #ef4444; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>EN VIVO</span>`;
        }
    }
    if (IS_MOCK) {
        engine.start();
    } else {
        engine.conectar("Display");
    }
    const initialPeers = engine.getPeers();
    initialPeers.forEach(p => addNode(p, true));

    setupEventListeners();
}
document.addEventListener("DOMContentLoaded", init);

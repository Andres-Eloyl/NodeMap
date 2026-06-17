/**
 * NodeMap Pulse - D3.js Live Dashboard
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- State ---
    let totalMessages = 0;
    let peakConnections = 0;
    
    // Data array for the bar chart (last 60 seconds)
    // We will keep an array of 60 buckets, each representing a second.
    const MAX_DATA_POINTS = 60;
    let chartData = Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({ time: i, value: 0 }));
    let currentSecondIndex = MAX_DATA_POINTS - 1;

    // --- DOM Elements ---
    const kpiNodes = document.getElementById("kpi-nodes");
    const kpiPeak = document.getElementById("kpi-peak");
    const kpiMessages = document.getElementById("kpi-messages");
    const chartContainer = document.getElementById("chart-container");

    // --- WebRTC Connection ---
    WebRTCEngine.conectar("Dashboard", "Central");

    // Hook to all possible network events to count traffic
    function recordActivity() {
        totalMessages++;
        kpiMessages.textContent = totalMessages;
        chartData[currentSecondIndex].value += 1;
    }

    WebRTCEngine.onMessage(PROTOCOL.CHAT, () => recordActivity());
    WebRTCEngine.onMessage(PROTOCOL.POSITION, () => recordActivity());
    WebRTCEngine.onMessage(PROTOCOL.HEATMAP_SYNC, () => recordActivity());
    WebRTCEngine.onMessage(PROTOCOL.ORGANIZER_BROADCAST, () => recordActivity());

    // Periodically update active node count and network quality
    setInterval(() => {
        const peers = WebRTCEngine.getPeers();
        const count = peers.length;
        kpiNodes.textContent = count;
        if (count > peakConnections) {
            peakConnections = count;
            kpiPeak.textContent = peakConnections;
        }

        // Calculate Average Latency
        let totalLatency = 0;
        let latencyCount = 0;
        for (const peer of peers) {
            const lat = WebRTCEngine.getLatency(peer.id);
            if (lat !== null && !isNaN(lat)) {
                totalLatency += lat;
                latencyCount++;
            }
        }
        
        const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
        const kpiLatency = document.getElementById("kpi-latency");
        const kpiLatencyIcon = document.getElementById("kpi-latency-icon");
        const kpiLatencyGlow = document.getElementById("kpi-latency-glow");
        
        if (kpiLatency) {
            kpiLatency.innerHTML = `${avgLatency}<span class="text-xl text-white/50">ms</span>`;
            
            // Remove previous colors
            kpiLatencyIcon.className = "material-symbols-outlined text-4xl transition-colors";
            kpiLatencyGlow.className = "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150";
            
            if (avgLatency === 0) {
                // No peers or no latency measured yet
                kpiLatencyIcon.classList.add("text-gray-400/80");
                kpiLatencyGlow.classList.add("bg-gray-500/10");
                kpiLatencyIcon.textContent = "wifi_off";
            } else if (avgLatency < 50) {
                kpiLatencyIcon.classList.add("text-green-400/80");
                kpiLatencyGlow.classList.add("bg-green-500/10");
                kpiLatencyIcon.textContent = "wifi";
            } else if (avgLatency <= 150) {
                kpiLatencyIcon.classList.add("text-yellow-400/80");
                kpiLatencyGlow.classList.add("bg-yellow-500/10");
                kpiLatencyIcon.textContent = "network_wifi_2_bar";
            } else {
                kpiLatencyIcon.classList.add("text-red-400/80");
                kpiLatencyGlow.classList.add("bg-red-500/10");
                kpiLatencyIcon.textContent = "network_wifi_1_bar";
            }
        }
    }, 1000);

    // --- D3.js Setup ---
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    
    // We append the SVG to the container
    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("class", "d3-chart")
        .style("width", "100%")
        .style("height", "100%");

    // Linear gradient for bars
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "bar-gradient")
        .attr("x1", "0%").attr("y1", "100%")
        .attr("x2", "0%").attr("y2", "0%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffb3ad").attr("stop-opacity", 0.6);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ff5451").attr("stop-opacity", 1);

    const chartGroup = svg.append("g");
    const xAxisGroup = svg.append("g");
    const yAxisGroup = svg.append("g");

    let width = 0, height = 0;
    let x, y;

    function resizeChart() {
        const rect = chartContainer.getBoundingClientRect();
        width = rect.width - margin.left - margin.right;
        height = rect.height - margin.top - margin.bottom;

        chartGroup.attr("transform", `translate(${margin.left},${margin.top})`);
        xAxisGroup.attr("transform", `translate(${margin.left},${height + margin.top})`);
        yAxisGroup.attr("transform", `translate(${margin.left},${margin.top})`);

        x = d3.scaleBand().range([0, width]).padding(0.2);
        y = d3.scaleLinear().range([height, 0]);
        
        updateChart(false);
    }

    function updateChart(animate = true) {
        if (width === 0 || height === 0) return;

        x.domain(chartData.map(d => d.time));
        
        // Dynamically adjust Y scale max, minimum of 5 for aesthetics
        const maxVal = d3.max(chartData, d => d.value);
        y.domain([0, Math.max(5, maxVal + 2)]);

        // Axes
        const xAxis = d3.axisBottom(x).tickFormat("").tickSize(0); // Hide x ticks labels
        const yAxis = d3.axisLeft(y).ticks(5).tickSize(-width); // Grid lines

        xAxisGroup.call(xAxis);
        yAxisGroup.transition().duration(animate ? 500 : 0).call(yAxis);

        // Bind data
        const bars = chartGroup.selectAll(".bar")
            .data(chartData, d => d.time); // Key by time index

        // Enter
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.time))
            .attr("y", height)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            // Update
            .merge(bars)
            .transition()
            .duration(animate ? 400 : 0)
            .ease(d3.easeCubicOut)
            .attr("x", d => x(d.time))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.value));

        // Exit
        bars.exit().remove();
    }

    window.addEventListener("resize", resizeChart);
    // Initial size
    setTimeout(resizeChart, 100);

    // --- Ticker (Shift data every second) ---
    setInterval(() => {
        // Shift all data to the left
        for (let i = 0; i < MAX_DATA_POINTS - 1; i++) {
            chartData[i].value = chartData[i + 1].value;
        }
        // Reset current second value
        chartData[MAX_DATA_POINTS - 1].value = 0;
        
        updateChart(true);
    }, 1000);

    // --- Packet Sniffer (Terminal) ---
    const terminalOutput = document.getElementById('terminal-output');
    WebRTCEngine.onMessage("RAW_PACKET", (packet) => {
        if (!terminalOutput) return;

        // Try to parse just to see if it's a message type we want to highlight
        let msgType = "UNKNOWN";
        try {
            const parsed = JSON.parse(packet.raw);
            msgType = parsed.tipo ? parsed.tipo.toUpperCase() : "RAW_DATA";
            // Do not show pings to avoid spamming the console
            if (msgType === "PING" || msgType === "PONG") return;
        } catch(e) {}

        const el = document.createElement('div');
        el.className = "break-all bg-green-500/5 p-2 rounded border border-green-500/10";
        
        const header = `<div class="text-white/60 mb-1 flex justify-between">
            <span>[${new Date().toLocaleTimeString()}] INBOUND_PACKET</span>
            <span class="text-yellow-400">${packet.size} B</span>
        </div>`;
        
        // Highlight encrypted payload if exists
        let rawText = packet.raw;
        if (rawText.includes('_encrypted')) {
            rawText = rawText.replace(/"_encrypted":"([^"]+)"/, '"_encrypted":"<span class="text-red-400 bg-red-400/10 px-1 font-bold animate-pulse">$1</span>"');
            el.innerHTML = `${header}<div class="text-green-400 font-bold mb-1">[SECURE E2EE PAYLOAD DETECTED]</div><div>${rawText}</div>`;
        } else {
            el.innerHTML = `${header}<div class="text-green-500/70">${rawText}</div>`;
        }

        terminalOutput.appendChild(el);
        
        // Keep max 50 lines
        if (terminalOutput.children.length > 50) {
            terminalOutput.removeChild(terminalOutput.firstChild);
        }

        // Auto scroll
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    });

    // --- Animated Background ---
    const bgContainer = document.getElementById('animated-bg');
    if (bgContainer) {
        const length = 25;
        const animationTime = 45;
        const baseColors = ['#ffb3ad', '#e3bdba', '#69d8d4']; 
        
        for (let i = 1; i <= length; i++) {
            const div = document.createElement('div');
            div.className = 'rainbow-line';
            
            const colors = [...baseColors].sort(() => Math.random() - 0.5);
            
            div.style.boxShadow = `
                -130px 0 80px 40px #13121d, 
                -50px 0 50px 25px ${colors[0]},
                0 0 50px 25px ${colors[1]}, 
                50px 0 50px 25px ${colors[2]},
                130px 0 80px 40px #13121d
            `;
            
            const duration = animationTime - (animationTime / length / 2 * i);
            const delay = -(i / length * animationTime);
            
            div.style.animation = `slide-bg ${duration}s linear infinite`;
            div.style.animationDelay = `${delay}s`;
            
            bgContainer.appendChild(div);
        }
    }
});

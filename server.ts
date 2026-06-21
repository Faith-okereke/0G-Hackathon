import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";

interface DeFiPosition {
  id: string;
  protocol: 'Uniswap v3' | 'Aave v3' | 'Curve' | 'Compound';
  pool: string;
  value: number;
  targetRange: string;
  drift: number;
  lastRebalance: string;
  status: 'green' | 'amber' | 'red';
  tokenA: string;
  tokenB: string;
}

// Initialize Gemini if key is provided
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Initial positions state with explicit type safety assignment
let positions: DeFiPosition[] = [
  {
    id: "pos_1",
    protocol: "Uniswap v3" as const,
    pool: "USDC / ETH (0.05%)",
    value: 15320,
    targetRange: "2,850 - 3,150 USD/ETH",
    drift: 1.8,
    lastRebalance: "2 hours ago",
    status: "green" as const,
    tokenA: "USDC",
    tokenB: "ETH",
  },
  {
    id: "pos_2",
    protocol: "Aave v3" as const,
    pool: "USDC Supply Vault",
    value: 8140,
    targetRange: "> 4.5% APY",
    drift: 0.2,
    lastRebalance: "1 day ago",
    status: "green" as const,
    tokenA: "USDC",
    tokenB: "aUSDC",
  },
  {
    id: "pos_3",
    protocol: "Curve" as const,
    pool: "3pool (DAI/USDC/USDT)",
    value: 4120,
    targetRange: "Stable Balance Ratio",
    drift: 4.5,
    lastRebalance: "3 days ago",
    status: "amber" as const,
    tokenA: "3CRV",
    tokenB: "USDC",
  },
];

// Initial limits state
let limits = {
  perTxMax: 500,
  dailyCap: 2000,
  coSignThreshold: 1000,
  cooldownPeriod: 900, // 15 mins (900 seconds)
};

interface DecisionLog {
  id: string;
  timestamp: string;
  cycleNumber: number;
  action: "REBALANCE" | "HOLD" | "ALERT" | "FAILED";
  protocol: string;
  amount: number;
  reasoning: string;
  receiptHash: string;
  txHash: string;
  status: 'verified' | 'pending' | 'failed' | 'rejected';
  inputState: {
    positions: DeFiPosition[];
    prices: Record<string, number>;
    limits: typeof limits;
  };
}

let whitelistedProtocols = ["Uniswap v3", "Aave v3"];
let isPaused = false;
let vaultAddress = "";
let walletConnected = false;
let activeAgentKey = "0x7F...d49a";

// Generate mock transaction history
const generateMockLogs = (): DecisionLog[] => {
  const actions = ["REBALANCE" as const, "HOLD" as const, "ALERT" as const, "REBALANCE" as const, "HOLD" as const];
  const protocols = ["Uniswap v3", "Aave v3", "Curve", "Uniswap v3", "Aave v3"];
  return Array.from({ length: 15 }, (_, i) => {
    const hoursAgo = (i + 1) * 4;
    const time = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    const action = actions[i % actions.length];
    const amount = action === "REBALANCE" ? Math.floor(Math.random() * 300) + 120 : 0;
    
    return {
      id: `dec_${100 - i}`,
      timestamp: time,
      cycleNumber: 412 - i,
      action: action,
      protocol: protocols[i % protocols.length],
      amount: amount,
      reasoning: action === "REBALANCE" 
        ? `Observed concentration efficiency in the ${protocols[i % protocols.length]} pool falling below 0.85 threshold. Re-aligned liquidity ranges dynamically based on 0G Decentralized Compute volatility vectors.`
        : `DeFi pool liquidity ratios are locked within safe margins. Auto-conforming bounds matches high-confidence indicators. Hold position active.`,
      receiptHash: "0g_receipt_" + crypto.randomBytes(16).toString("hex"),
      txHash: action === "REBALANCE" ? "0x" + crypto.randomBytes(32).toString("hex") : "",
      status: (action === "REBALANCE" ? "verified" : "pending") as any,
      inputState: {
        positions: JSON.parse(JSON.stringify(positions)),
        prices: { ETH: 2950, USDC: 1.0, WBTC: 64200 },
        limits: limits,
      }
    };
  });
};

let decisionLogs: DecisionLog[] = generateMockLogs();

// 7-day visual chart points
let chartPoints = [
  { date: "Mon", value: 27100 },
  { date: "Tue", value: 27350 },
  { date: "Wed", value: 27200, actionMarker: { type: "REBALANCE" as const, label: "Uniswap Rebalance ($210)" } },
  { date: "Thu", value: 27480 },
  { date: "Fri", value: 27510 },
  { date: "Sat", value: 27400, actionMarker: { type: "REBALANCE" as const, label: "Aave Optimization ($140)" } },
  { date: "Sun", value: 27580 },
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Aegis Zero background engine is running perfectly!",
      serverTime: new Date().toISOString()
    });
  });

  app.get("/api/agent-state", (req, res) => {
    res.json({
      vaultDeployed: !!vaultAddress,
      vaultAddress,
      activeAgentKey,
      isPaused,
      limits,
      whitelistedProtocols,
      positions,
      decisionLogs,
      chartPoints,
    });
  });

  app.post("/api/onboarding", (req, res) => {
    const { perTxMax, dailyCap, coSignThreshold, protocols } = req.body;
    limits = {
      ...limits,
      perTxMax: Number(perTxMax) || limits.perTxMax,
      dailyCap: Number(dailyCap) || limits.dailyCap,
      coSignThreshold: Number(coSignThreshold) || limits.coSignThreshold,
    };
    whitelistedProtocols = protocols || whitelistedProtocols;
    
    // Simulate smart contract deploy on 0G Testnet
    vaultAddress = "0x" + crypto.randomBytes(20).toString("hex");
    
    // Add deploying confirmation block
    decisionLogs.unshift({
      id: `dec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycleNumber: 413,
      action: "HOLD",
      protocol: "System Deploy",
      amount: 0,
      reasoning: "DeFAIVault contract deployed successfully on 0G Chain. Limits bound structurally on-chain. Initialized Delegated Agent Key authorization.",
      receiptHash: "0g_receipt_genesis_" + crypto.randomBytes(16).toString("hex"),
      txHash: "0x" + crypto.randomBytes(32).toString("hex"),
      status: "verified",
      inputState: {
        positions,
        prices: { ETH: 3010, USDC: 1.0 },
        limits,
      }
    });

    res.json({
      success: true,
      vaultAddress,
      limits,
      whitelistedProtocols,
    });
  });

  app.post("/api/update-limits", (req, res) => {
    const { perTxMax, dailyCap, coSignThreshold } = req.body;
    limits = {
      ...limits,
      perTxMax: Number(perTxMax) || limits.perTxMax,
      dailyCap: Number(dailyCap) || limits.dailyCap,
      coSignThreshold: Number(coSignThreshold) || limits.coSignThreshold,
    };
    res.json({ success: true, limits });
  });

  app.post("/api/update-protocols", (req, res) => {
    const { protocols } = req.body;
    whitelistedProtocols = protocols;
    res.json({ success: true, whitelistedProtocols });
  });

  app.post("/api/rotate-key", (req, res) => {
    activeAgentKey = "0x" + crypto.randomBytes(20).toString("hex").substring(0, 8) + "...d92b";
    res.json({ success: true, activeAgentKey });
  });

  app.post("/api/emergency-pause", (req, res) => {
    const { paused } = req.body;
    isPaused = paused;
    res.json({ success: true, isPaused });
  });

  app.post("/api/add-funds", (req, res) => {
    const { amount } = req.body;
    if (positions.length > 0) {
      positions[0].value += Number(amount);
    }
    res.json({ success: true, positions });
  });

  app.post("/api/withdraw", (req, res) => {
    // Empty positions to owner address
    positions = positions.map(pos => ({ ...pos, value: 0, status: "green" as const }));
    res.json({ success: true, positions });
  });

  // Programmatic agent rebalancing trigger (Using Gemini or custom reasoning)
  app.post("/api/run-cycle", async (req, res) => {
    if (isPaused) {
      return res.status(400).json({ error: "Agent is currently paused." });
    }

    // Force drift to make the UI look alive and dynamic on demand!
    // Or generate slight change in active values
    positions = positions.map((pos) => {
      const change = (Math.random() - 0.4) * 2.5; // shift and scale
      const newValue = Math.max(0, Math.floor(pos.value + change * 100));
      const newDrift = Math.max(0, Number((pos.drift + change).toFixed(1)));
      let newStatus: "green" | "amber" | "red" = "green";
      if (newDrift > 6) newStatus = "red";
      else if (newDrift > 3) newStatus = "amber";

      return {
        ...pos,
        value: newValue,
        drift: newDrift,
        status: newStatus,
        lastRebalance: "Just now",
      };
    });

    const targetPos = positions.find((p) => p.status === "red" || p.status === "amber") || positions[0];
    const isDrifting = targetPos.drift > 3;

    let aiAction: "REBALANCE" | "HOLD" = isDrifting ? "REBALANCE" : "HOLD";
    let aiReasoning = "";
    let aiConfidence = 88;
    
    // Check limits if we want to rebalance
    let targetAmount = Math.floor(Math.random() * 250) + 120;
    if (aiAction === "REBALANCE" && targetAmount > limits.perTxMax) {
      aiAction = "HOLD";
      aiReasoning = `Rebalancing action on ${targetPos.protocol} requested but exceeds safe single-transaction threshold of $${limits.perTxMax}. Safety guardrail triggered off-chain.`;
    }

    // Call Gemini API if Key is present
    if (ai && aiAction === "REBALANCE") {
      try {
        const payloadPrompt = `
          Analyze the following DeFi portfolio position drift.
          Position: ${targetPos.protocol} ${targetPos.pool}
          Current Value: $${targetPos.value}
          Current Drift: ${targetPos.drift}% from target.
          Target limits: Single transaction max is $${limits.perTxMax}.
          
          You are an AI-Native Portfolio Manager running on 0G's verified compute network.
          Decide whether to REBALANCE (to lower drift to 0%) or HOLD.
          Provide a highly technical 2-3 sentence financial reasoning.
          Return a JSON format ONLY:
          {
            "action": "REBALANCE" | "HOLD",
            "reasoning": "your reasoning text",
            "confidence": percentage_number
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: payloadPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        if (parsed.action && parsed.reasoning) {
          aiAction = parsed.action;
          aiReasoning = parsed.reasoning;
          aiConfidence = parsed.confidence || 92;
        }
      } catch (err) {
        console.error("Gemini Generation failed, routing to local logic:", err);
      }
    }

    // Default Fallback Intelligent Reasoning texts
    if (!aiReasoning) {
      if (aiAction === "REBALANCE") {
        aiReasoning = `Analyzed dynamic concentration efficiency on ${targetPos.protocol} ${targetPos.pool}. Active range drift reached high variance limit of ${targetPos.drift}%. Re-aligned liquidity vectors to optimal centered offsets on 0G EVM chain with verifiable telemetry proof.`;
      } else {
        aiReasoning = `Checked 0G Network telemetry. All pools remain tightly synchronized inside user-defined boundaries (+/- 3%). Storage receipts intact, no intervention required for current cycle.`;
      }
    }

    const receiptHash = "0g_receipt_" + crypto.randomBytes(16).toString("hex");
    const txHash = aiAction === "REBALANCE" ? "0x" + crypto.randomBytes(32).toString("hex") : "";

    const newLog = {
      id: `dec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycleNumber: decisionLogs.length > 0 ? decisionLogs[0].cycleNumber + 1 : 1,
      action: aiAction,
      protocol: targetPos.protocol,
      amount: aiAction === "REBALANCE" ? targetAmount : 0,
      reasoning: aiReasoning,
      receiptHash,
      txHash,
      status: (aiAction === "REBALANCE" ? "verified" : "pending") as any,
      inputState: {
        positions: JSON.parse(JSON.stringify(positions)),
        prices: { ETH: 2980, USDC: 1.0 },
        limits,
      }
    };

    decisionLogs.unshift(newLog);

    // If rebalanced, reset drift on that position
    if (aiAction === "REBALANCE") {
      positions = positions.map((p) => {
        if (p.id === targetPos.id) {
          return {
            ...p,
            drift: 0.1,
            status: "green" as const,
            lastRebalance: "Just now",
          };
        }
        return p;
      });

      // Update 7-day chart with rebalance effect
      chartPoints.push({
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: chartPoints[chartPoints.length - 1].value + targetAmount,
        actionMarker: {
          type: "REBALANCE" as const,
          label: `${targetPos.protocol} Rebalance ($${targetAmount})`,
        }
      });
      if (chartPoints.length > 10) chartPoints.shift();
    }

    res.json({
      success: true,
      newAction: newLog,
      positions,
    });
  });

  // Serve static UI assets or mount Vite dev environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

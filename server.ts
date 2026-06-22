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

// Map storage to keep distinct user states concurrently
interface AddressState {
  vaultDeployed: boolean;
  vaultAddress: string;
  activeAgentKey: string;
  isPaused: boolean;
  limits: typeof limits;
  whitelistedProtocols: string[];
  positions: DeFiPosition[];
  decisionLogs: DecisionLog[];
  chartPoints: {
    date: string;
    value: number;
    actionMarker?: {
      type: "REBALANCE";
      label: string;
    };
  }[];
}

const addressStates = new Map<string, AddressState>();

const getOrCreateStateForAddress = (addressStr: string) => {
  const normAddress = (addressStr || "").toLowerCase().trim();
  const lookupAddress = normAddress || "0x0000000000000000000000000000000000000000";

  if (addressStates.has(lookupAddress)) {
    return addressStates.get(lookupAddress)!;
  }

  // Generate deterministic randomized characteristics based on address string
  let hashVal = 0;
  for (let i = 0; i < lookupAddress.length; i++) {
    hashVal = (hashVal << 5) - hashVal + lookupAddress.charCodeAt(i);
    hashVal |= 0;
  }
  hashVal = Math.abs(hashVal);

  // Deterministic realistic portfolio value between $20,000 and $100,000
  const portfolioBase = 20000 + (hashVal % 80000);

  // Divide portfolio value
  const val1 = Math.floor(portfolioBase * 0.55);
  const val2 = Math.floor(portfolioBase * 0.30);
  const val3 = portfolioBase - (val1 + val2);

  const customPositions: DeFiPosition[] = [
    {
      id: "pos_1",
      protocol: "Uniswap v3" as const,
      pool: "USDC / ETH (0.05%)",
      value: val1,
      targetRange: "2,850 - 3,150 USD/ETH",
      drift: Number((1.2 + (hashVal % 18) / 10).toFixed(1)),
      lastRebalance: "2 hours ago",
      status: (1.2 + (hashVal % 18) / 10) > 3 ? ("amber" as const) : ("green" as const),
      tokenA: "USDC",
      tokenB: "ETH",
    },
    {
      id: "pos_2",
      protocol: "Aave v3" as const,
      pool: "USDC Supply Vault",
      value: val2,
      targetRange: "> 4.5% APY",
      drift: Number(((hashVal % 12) / 10).toFixed(1)),
      lastRebalance: "1 day ago",
      status: "green" as const,
      tokenA: "USDC",
      tokenB: "aUSDC",
    },
    {
      id: "pos_3",
      protocol: "Curve" as const,
      pool: "3pool (DAI/USDC/USDT)",
      value: val3,
      targetRange: "Stable Balance Ratio",
      drift: Number((2.5 + (hashVal % 20) / 10).toFixed(1)),
      lastRebalance: "3 days ago",
      status: (2.5 + (hashVal % 20) / 10) > 4 ? ("red" as const) : ("amber" as const),
      tokenA: "3CRV",
      tokenB: "USDC",
    }
  ];

  const customChartPoints = [
    { date: "Mon", value: Math.floor(portfolioBase * 0.98) },
    { date: "Tue", value: Math.floor(portfolioBase * 0.99) },
    { date: "Wed", value: Math.floor(portfolioBase * 0.985), actionMarker: { type: "REBALANCE" as const, label: `Uniswap Rebalance ($${Math.floor(portfolioBase * 0.01)})` } },
    { date: "Thu", value: Math.floor(portfolioBase * 0.995) },
    { date: "Fri", value: Math.floor(portfolioBase * 1.0) },
    { date: "Sat", value: Math.floor(portfolioBase * 0.992), actionMarker: { type: "REBALANCE" as const, label: `Aave Optimization ($${Math.floor(portfolioBase * 0.005)})` } },
    { date: "Sun", value: portfolioBase },
  ];

  // Generated customized logs for this address
  const actions: ("REBALANCE" | "HOLD" | "ALERT")[] = ["REBALANCE", "HOLD", "ALERT"];
  const protocols = ["Uniswap v3", "Aave v3", "Curve"];
  const customLogs: DecisionLog[] = Array.from({ length: 10 }, (_, i) => {
    const hoursAgo = (i + 1) * 8;
    const time = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    const action = actions[(hashVal + i) % actions.length];
    const amount = action === "REBALANCE" ? Math.floor(((hashVal + i) % 150) + 100) : 0;
    const protocol = protocols[(hashVal + i) % protocols.length];
    
    return {
      id: `dec_${Date.now() - i * 500000}`,
      timestamp: time,
      cycleNumber: 312 - i,
      action: action === "ALERT" ? "HOLD" : action,
      protocol: protocol,
      amount: amount,
      reasoning: action === "REBALANCE" 
        ? `Observed concentration efficiency in the ${protocol} pool falling below user threshold. Re-aligned liquidity ranges dynamically based on 0G Decentralized Compute volatility vectors.`
        : `DeFi pool liquidity ratios are locked within safe margins. Auto-conforming bounds matches high-confidence indicators. Hold position active.`,
      receiptHash: "0g_receipt_" + crypto.randomBytes(16).toString("hex"),
      txHash: action === "REBALANCE" ? "0x" + crypto.randomBytes(32).toString("hex") : "",
      status: (action === "REBALANCE" ? "verified" : "pending") as any,
      inputState: {
        positions: customPositions,
        prices: { ETH: 2950, USDC: 1.0, WBTC: 64200 },
        limits: {
          perTxMax: 500,
          dailyCap: 2000,
          coSignThreshold: 1000,
          cooldownPeriod: 900
        },
      }
    };
  });

  // Check if this look-up is a preset simulation option or already has been onboarded
  const isDemoAddress = [
    "0x71c7656ec7ab88b098defb751b7401b5f6d1476b",
    "0x9ce41ac5718aea6eba1b88e0797435f3b79da93c",
    "0xf1a51197ea8aeb098defb51b5d1a00caba1a76bd"
  ].includes(lookupAddress);

  const state: AddressState = {
    vaultDeployed: isDemoAddress,
    vaultAddress: isDemoAddress ? "0x" + crypto.createHash('sha256').update(lookupAddress).digest('hex').substring(0, 40) : "",
    activeAgentKey: "0x" + crypto.createHash('md5').update(lookupAddress).digest('hex').substring(0, 8) + "...d49a",
    isPaused: false,
    limits: {
      perTxMax: 500,
      dailyCap: 2000,
      coSignThreshold: 1000,
      cooldownPeriod: 900,
    },
    whitelistedProtocols: ["Uniswap v3", "Aave v3"],
    positions: customPositions,
    decisionLogs: customLogs,
    chartPoints: customChartPoints,
  };

  addressStates.set(lookupAddress, state);
  return state;
};

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
    const address = (req.query.address as string) || "0x0000000000000000000000000000000000000000";
    const state = getOrCreateStateForAddress(address);
    res.json({
      vaultDeployed: state.vaultDeployed,
      vaultAddress: state.vaultAddress,
      activeAgentKey: state.activeAgentKey,
      isPaused: state.isPaused,
      limits: state.limits,
      whitelistedProtocols: state.whitelistedProtocols,
      positions: state.positions,
      decisionLogs: state.decisionLogs,
      chartPoints: state.chartPoints,
    });
  });

  app.post("/api/onboarding", (req, res) => {
    const { address, perTxMax, dailyCap, coSignThreshold, protocols } = req.body;
    const state = getOrCreateStateForAddress(address);
    
    state.limits = {
      ...state.limits,
      perTxMax: Number(perTxMax) || state.limits.perTxMax,
      dailyCap: Number(dailyCap) || state.limits.dailyCap,
      coSignThreshold: Number(coSignThreshold) || state.limits.coSignThreshold,
    };
    state.whitelistedProtocols = protocols || state.whitelistedProtocols;
    state.vaultDeployed = true;
    
    // Simulate smart contract deploy on 0G Testnet
    state.vaultAddress = "0x" + crypto.randomBytes(20).toString("hex");
    
    // Add deploying confirmation block
    state.decisionLogs.unshift({
      id: `dec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycleNumber: state.decisionLogs.length > 0 ? state.decisionLogs[0].cycleNumber + 1 : 1,
      action: "HOLD",
      protocol: "System Deploy",
      amount: 0,
      reasoning: "DeFAIVault contract deployed successfully on 0G Chain. Limits bound structurally on-chain. Initialized Delegated Agent Key authorization.",
      receiptHash: "0g_receipt_genesis_" + crypto.randomBytes(16).toString("hex"),
      txHash: "0x" + crypto.randomBytes(32).toString("hex"),
      status: "verified",
      inputState: {
        positions: state.positions,
        prices: { ETH: 3010, USDC: 1.0 },
        limits: state.limits,
      }
    });

    res.json({
      success: true,
      vaultAddress: state.vaultAddress,
      limits: state.limits,
      whitelistedProtocols: state.whitelistedProtocols,
    });
  });

  app.post("/api/update-limits", (req, res) => {
    const { address, perTxMax, dailyCap, coSignThreshold } = req.body;
    const state = getOrCreateStateForAddress(address);
    state.limits = {
      ...state.limits,
      perTxMax: Number(perTxMax) || state.limits.perTxMax,
      dailyCap: Number(dailyCap) || state.limits.dailyCap,
      coSignThreshold: Number(coSignThreshold) || state.limits.coSignThreshold,
    };
    res.json({ success: true, limits: state.limits });
  });

  app.post("/api/update-protocols", (req, res) => {
    const { address, protocols } = req.body;
    const state = getOrCreateStateForAddress(address);
    state.whitelistedProtocols = protocols;
    res.json({ success: true, whitelistedProtocols: state.whitelistedProtocols });
  });

  app.post("/api/rotate-key", (req, res) => {
    const { address } = req.body;
    const state = getOrCreateStateForAddress(address);
    state.activeAgentKey = "0x" + crypto.randomBytes(20).toString("hex").substring(0, 8) + "...d92b";
    res.json({ success: true, activeAgentKey: state.activeAgentKey });
  });

  app.post("/api/emergency-pause", (req, res) => {
    const { address, paused } = req.body;
    const state = getOrCreateStateForAddress(address);
    state.isPaused = paused;
    res.json({ success: true, isPaused: state.isPaused });
  });

  app.post("/api/add-funds", (req, res) => {
    const { address, amount } = req.body;
    const state = getOrCreateStateForAddress(address);
    if (state.positions.length > 0) {
      state.positions[0].value += Number(amount);
    }
    res.json({ success: true, positions: state.positions });
  });

  app.post("/api/withdraw", (req, res) => {
    const { address } = req.body;
    const state = getOrCreateStateForAddress(address);
    // Move positions to 0 USD in mock
    state.positions = state.positions.map(pos => ({ ...pos, value: 0, status: "green" as const }));
    res.json({ success: true, positions: state.positions });
  });

  // Programmatic agent rebalancing trigger (Using Gemini or custom reasoning)
  app.post("/api/run-cycle", async (req, res) => {
    const address = (req.query.address as string) || (req.body.address as string) || "0x0000000000000000000000000000000000000000";
    const state = getOrCreateStateForAddress(address);

    if (state.isPaused) {
      return res.status(400).json({ error: "Agent is currently paused." });
    }

    // Force drift to make the UI look alive and dynamic on demand!
    // Or generate slight change in active values
    state.positions = state.positions.map((pos) => {
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

    const targetPos = state.positions.find((p) => p.status === "red" || p.status === "amber") || state.positions[0];
    const isDrifting = targetPos.drift > 3;

    let aiAction: "REBALANCE" | "HOLD" = isDrifting ? "REBALANCE" : "HOLD";
    let aiReasoning = "";
    let aiConfidence = 88;
    
    // Check limits if we want to rebalance
    let targetAmount = Math.floor(Math.random() * 250) + 120;
    if (aiAction === "REBALANCE" && targetAmount > state.limits.perTxMax) {
      aiAction = "HOLD";
      aiReasoning = `Rebalancing action on ${targetPos.protocol} requested but exceeds safe single-transaction threshold of $${state.limits.perTxMax}. Safety guardrail triggered off-chain.`;
    }

    // Call Gemini API if Key is present
    if (ai && aiAction === "REBALANCE") {
      try {
        const payloadPrompt = `
          Analyze the following DeFi portfolio position drift.
          Position: ${targetPos.protocol} ${targetPos.pool}
          Current Value: $${targetPos.value}
          Current Drift: ${targetPos.drift}% from target.
          Target limits: Single transaction max is $${state.limits.perTxMax}.
          
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
      cycleNumber: state.decisionLogs.length > 0 ? state.decisionLogs[0].cycleNumber + 1 : 1,
      action: aiAction,
      protocol: targetPos.protocol,
      amount: aiAction === "REBALANCE" ? targetAmount : 0,
      reasoning: aiReasoning,
      receiptHash,
      txHash,
      status: (aiAction === "REBALANCE" ? "verified" : "pending") as any,
      inputState: {
        positions: JSON.parse(JSON.stringify(state.positions)),
        prices: { ETH: 2980, USDC: 1.0 },
        limits: state.limits,
      }
    };

    state.decisionLogs.unshift(newLog);

    // If rebalanced, reset drift on that position
    if (aiAction === "REBALANCE") {
      state.positions = state.positions.map((p) => {
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
      state.chartPoints.push({
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: state.chartPoints[state.chartPoints.length - 1].value + targetAmount,
        actionMarker: {
          type: "REBALANCE" as const,
          label: `${targetPos.protocol} Rebalance ($${targetAmount})`,
        }
      });
      if (state.chartPoints.length > 10) state.chartPoints.shift();
    }

    res.json({
      success: true,
      newAction: newLog,
      positions: state.positions,
    });
  });

  // Serve static UI assets or mount Vite dev environment
  if (!process.env.VERCEL) {
    const startServing = async () => {
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
    };
    startServing();
  }

export default app;

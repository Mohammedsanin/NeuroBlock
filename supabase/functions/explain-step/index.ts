/// <reference path="../_types/deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stepType, datasetInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context about the dataset if available
    let datasetContext = "";
    if (datasetInfo) {
      datasetContext = `
The user has uploaded a dataset called "${datasetInfo.fileName}" with:
- ${datasetInfo.rows} rows and ${datasetInfo.columns.length} columns
- Columns: ${datasetInfo.columns.slice(0, 8).join(", ")}${datasetInfo.columns.length > 8 ? ` and ${datasetInfo.columns.length - 8} more` : ""}
- Column types: ${Object.entries(datasetInfo.columnTypes || {}).slice(0, 5).map(([col, type]) => `${col} (${type})`).join(", ")}
`;
    }

    // Define explanations based on step type
    const stepPrompts: Record<string, string> = {
      dataset: `Explain what happens when a user uploads a dataset for machine learning. ${datasetContext ? `Use this specific dataset context: ${datasetContext}` : ""}
Explain in 2-3 simple sentences:
- What the tool does with the uploaded data
- Why this step is important for beginners`,

      preprocess: `Explain preprocessing in machine learning for beginners. ${datasetContext ? `The user's dataset has these columns: ${datasetInfo?.columns?.slice(0, 5).join(", ")}` : ""}
Explain in 2-3 simple sentences:
- What standardization and normalization do to the data
- Why this helps the model learn better
Use a simple real-world analogy if helpful.`,

      feature: `Explain feature engineering in machine learning for beginners. ${datasetContext ? `The user's dataset has: ${Object.entries(datasetInfo?.columnTypes || {}).map(([col, type]) => `${col} (${type})`).slice(0, 4).join(", ")}` : ""}
Explain in 2-3 simple sentences:
- What handling missing values means
- What encoding categorical variables does
- Why creating new features can help
Keep it very simple and beginner-friendly.`,

      split: `Explain train-test split in machine learning for beginners. ${datasetContext ? `The user has ${datasetInfo?.rows} data points to split.` : ""}
Explain in 2-3 simple sentences:
- Why we divide data into training and testing sets
- What a good split ratio means
Use a simple analogy like studying for an exam.`,

      model: `Explain model selection in machine learning for beginners. Keep it very simple.
Explain in 2-3 sentences:
- What a machine learning model does
- Why different models work for different problems
- What hyperparameters are (in very simple terms)`,

      results: `Explain how to interpret machine learning results for beginners. 
Explain in 2-3 simple sentences:
- What accuracy means
- What a confusion matrix shows
- How to know if the model is good`
    };

    const systemPrompt = `You are a friendly ML tutor explaining concepts to complete beginners with zero coding or machine learning background. 
- Use simple everyday language
- Avoid technical jargon
- Use analogies to everyday life
- Keep explanations to 2-4 sentences max
- Be encouraging and supportive
- If dataset info is provided, reference specific column names or data types to make it personal`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: stepPrompts[stepType] || "Explain this ML pipeline step simply." }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Unable to generate explanation.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in explain-step function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

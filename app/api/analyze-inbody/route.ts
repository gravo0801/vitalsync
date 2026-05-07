import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // 1분

const SYSTEM_PROMPT = `당신은 한국 인바디(InBody) 검사 결과지를 분석하는 전문가입니다.
업로드된 이미지/PDF에서 다음 정보를 추출하여 JSON 형식으로만 응답하세요.
다른 설명, 마크다운, 코드 펜스(\`\`\`) 없이 순수 JSON만 반환하세요.

추출할 항목 (못 찾으면 null):
- measuredAt: 측정일 (YYYY-MM-DD 형식. 결과지에 적힌 검사일자)
- weight: 체중 (kg, 숫자만)
- skeletalMuscleMass: 골격근량 (kg)
- bodyFatMass: 체지방량 (kg)
- bodyFatPercent: 체지방률 (%, 백분율 숫자만)
- bmi: BMI 지수
- bmr: 기초대사량 (kcal)
- visceralFatLevel: 내장지방 레벨 (1~30 범위 정수)
- totalBodyWater: 체수분량 (kg 또는 L)
- protein: 단백질 (kg)
- minerals: 무기질 (kg)
- inbodyScore: 인바디 점수 (0~100)

규칙:
1. 모든 숫자는 단위 기호 없이 숫자값으로만. 예: "98.4kg" → 98.4
2. 측정일이 "2024년 11월 5일" 같은 형식이면 "2024-11-05"로 변환
3. 한국식 인바디 결과지(InBody 270, 370, 570, 770, 970 등) 모두 지원
4. 응답은 반드시 단 하나의 JSON 객체. 다른 텍스트 절대 금지.

예시 응답:
{"measuredAt":"2024-11-05","weight":98.4,"skeletalMuscleMass":36.2,"bodyFatMass":29.5,"bodyFatPercent":30.0,"bmi":31.7,"bmr":1820,"visceralFatLevel":13,"totalBodyWater":50.1,"protein":13.4,"minerals":4.8,"inbodyScore":68}`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // 10MB 제한
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 10MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type;

    const isPDF = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");
    if (!isPDF && !isImage) {
      return NextResponse.json(
        { error: "이미지 또는 PDF만 지원됩니다." },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 메시지 컨텐츠 구성
    const userContent: Anthropic.Messages.ContentBlockParam[] = [];

    if (isPDF) {
      userContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      });
    } else {
      // image/jpeg, image/png, image/webp, image/gif
      const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const safeType = validImageTypes.includes(mimeType) ? mimeType : "image/jpeg";
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          media_type: safeType as any,
          data: base64,
        },
      });
    }

    userContent.push({
      type: "text",
      text: "위 인바디 결과지에서 데이터를 추출하여 JSON 객체 하나로만 응답해주세요.",
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    // 응답에서 텍스트 추출
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AI 응답에서 텍스트를 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    const rawText = textBlock.text.trim();
    // 혹시라도 코드 펜스 들어왔으면 제거
    const cleaned = rawText
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // JSON 파싱 실패 - 텍스트에서 첫 { ~ 마지막 } 추출 재시도
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) {
        return NextResponse.json(
          { error: "AI 응답을 JSON으로 파싱할 수 없습니다.", rawText },
          { status: 500 }
        );
      }
      parsed = JSON.parse(m[0]);
    }

    return NextResponse.json({
      data: parsed,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    console.error("[analyze-inbody]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

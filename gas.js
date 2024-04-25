const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4-turbo";
const MAX_MESSAGE_LEN = 1000;
const MAX_TOKENS = 1000;

// スクリプトプロパティを取得
const OPENAI_API_KEY =
	PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
const DISCORD_APPLICATION_APP =
	PropertiesService.getScriptProperties().getProperty(
		"DISCORD_APPLICATION_APP"
	);
const DISCORD_BOT_TOKEN =
	PropertiesService.getScriptProperties().getProperty("DISCORD_BOT_TOKEN");
const CALLBACK_ENDPOINT =
	PropertiesService.getScriptProperties().getProperty("CALLBACK_ENDPOINT");

/**
 * DOI を抽出する
 */
const getDOI = (str) => {
	const split = str.split("/");
	if (split.length < 2) {
		throw Error("Invalid DOI");
	}
	return `${split.at(-2)}/${split.at(-1)}`;
};

/**
 * 論文概要を取得する
 */
const getAbstract = (doi) => {
	const response = UrlFetchApp.fetch(`https://doi.org/${doi}`);
	const text = response.getContentText();

	try {
		const html = text.replaceAll(/[\n\r\t]/g, "").replaceAll(/ +/g, " ");

		// ACM
		if (text.includes("https://dl.acm.org/doi/")) {
			const title = html.match(/<h1 class="citation__title">(.+?)<\/h1>/)[1];
			const abstract = html.match(
				/<div class="abstractSection abstractInFull"> ?<p>(.+?)<\/p>/
			)[1];
			return { title, abstract };
		}
		// J-STAGE
		if (text.includes("https://www.jstage.jst.go.jp/")) {
			const title = html.match(
				/<div class="global-article-title">(.+?)<\/div>/
			)[1];
			const abstract = html.match(/<p class="global-para-14">(.+?)<\/p>/)[1];
			return { title, abstract };
		}
		throw Error("Unsupported site");
	} catch (e) {
		throw Error(`Failed to fetch abstract: ${e}`);
	}
};

/**
 * GPT を用いて論文を 3 行で要約する
 */
const summarizeWithGPT = (abstract) => {
	// 要約
	const assistantPrompt = `あなたはヒューマンコンピュータインタラクション（HCI）分野の優れた研究者である．
「解説すべき論文のアブストラクト」を要約しなさい．
出力は以下の 1. ルール 2. フォーマット に従うこと．

1. ルール
・要約は箇条書きを用いて3行で出力する．
・要約には筆者独自の検討や重要な結論を必ず含める．
・要約には「だ・である」調を用いる．「です」「ます」は使用しない．

2. フォーマット
- 項目1
- 項目2
- 項目3`;
	const userPrompt = `解説すべき論文のアブストラクト
${abstract.slice(0, MAX_MESSAGE_LEN)}`;
	const body = {
		model: OPENAI_MODEL,
		messages: [
			{
				role: "assistant",
				content: assistantPrompt,
			},
			{
				role: "user",
				content: userPrompt,
			},
		],
		max_tokens: MAX_TOKENS,
	};
	try {
		const response = UrlFetchApp.fetch(OPENAI_ENDPOINT, {
			method: "POST",
			crossDomain: true,
			contentType: "application/json",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
			},
			payload: JSON.stringify(body),
		});
		const json = JSON.parse(response.getContentText());
		return json.choices[0].message.content
			.replaceAll("。", "．")
			.replaceAll("、", "，");
	} catch (e) {
		throw Error(`Failed to connect to OpenAI API: ${e}`);
	}
};

/**
 * GPT に論文を解説させる
 */
const explainWithGPT = (abstract) => {
	const assistantPrompt = `あなたはヒューマンコンピュータインタラクション（HCI）分野の優れた研究者である．
「〜である」調を用いて，「解説すべき論文のアブストラクト」を300字程度で解説しなさい．
以下の例に沿って出力すること．

入力例
Logging is a widely used technique for inspecting and understanding programs. However, the presentation of logs still often takes its ancient form of a linear stream of text that resides in a terminal, console, or log file. Despite its simplicity, interpreting log output is often challenging due to the large number of textual logs that lack structure and context. We conducted content analysis and expert interviews to understand the practices and challenges inherent in logging. These activities demonstrated that the current representation of logs does not provide the rich structures programmers need to interpret them or the program's behavior. We present Log-it, a logging interface that enables programmers to interactively structure and visualize logs in situ. A user study with novices and experts showed that Log-it's syntax and interface have a minimal learning curve, and the interactive representations and organizations of logs help programmers easily locate, synthesize, and understand logs.

出力例
ログは，プログラムを検査し理解するために広く使われている手法である．しかしログ解釈は，構造およびコンテキストを欠く大量のテキストログによりしばしば困難となる．内容分析と専門家インタビューを実施した結果，現在のログの表現は，プログラマがログ動作の解釈に必要な豊富な構造を提供しないことが示された．我々は、プログラマがログをインタラクティブに構造化し，その場で可視化することを可能にするロギング・インターフェース Log-it を発表した。ユーザー調査より、Log-it の構文とインターフェースは最小限の学習曲線を示し、ログの対話的な表現および構成がプログラマーが簡単にログを発見，合成，理解するのに役立つことを示した。`;
	const userPrompt = `解説すべき論文のアブストラクト
${abstract.slice(0, MAX_MESSAGE_LEN)}`;
	const body = {
		model: MODEL,
		messages: [
			{
				role: "assistant",
				content: assistantPrompt,
			},
			{
				role: "user",
				content: userPrompt,
			},
		],
		max_tokens: MAX_TOKENS,
	};
	try {
		const response = UrlFetchApp.fetch(ENDPOINT, {
			method: "POST",
			crossDomain: true,
			contentType: "application/json",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
			},
			payload: JSON.stringify(body),
		});
		const json = JSON.parse(response.getContentText());
		return json.choices[0].message.content
			.replaceAll("。", "．")
			.replaceAll("、", "，");
	} catch (e) {
		throw Error(`Failed to connect to GPT-3.5: ${e}`);
	}
};

/**
 * Discord に返答する
 */
const responseToDiscord = (interactionToken, content) => {
	const body = { interactionToken, content };
	try {
		UrlFetchApp.fetch(CALLBACK_ENDPOINT, {
			method: "POST",
			crossDomain: true,
			contentType: "application/json",
			payload: JSON.stringify(body),
		});
	} catch (e) {
		Logger.log(e);
		throw Error(`Failed to response: ${e}`);
	}
};

const main = (doiCandidate, interactionToken) => {
	const doi = getDOI(doiCandidate);
	const { title, abstract } = getAbstract(doi);
	const summarizeResult = summarizeWithGPT(abstract)
		.split("\n")
		.filter((line) => line.length > 0)
		.join("\n");

	const content = `## ${title}
[${doi}](https://doi.org/${doi})
### 概要
${summarizeResult}`;
	responseToDiscord(interactionToken, content);

	const result = {
		title,
		doi,
		result: gptResult,
	};
	const output = ContentService.createTextOutput();
	output.setMimeType(ContentService.MimeType.JSON);
	output.setContent(JSON.stringify(result));
	return output;
};

const doGet = (e) => {
	const doi = e.parameter.doi;
	const interactionToken = e.parameter.interactionToken;
	if (!doi || !interactionToken) {
		throw new Error("param is undefined.");
	}
	return main(doi, interactionToken);
};

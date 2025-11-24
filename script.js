// PC側のグーチョキパー画像（自分のファイル名に合わせて書き換えてOK）
const npcHands = [
  { hand: "グー", src: "npc-images/gu.png" },
  { hand: "チョキ", src: "npc-images/choki.png" },
  { hand: "パー", src: "npc-images/pa.png" },
];

document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("upload-btn");
  const userFileInput = document.getElementById("user-file");
  const userPreview = document.getElementById("user-preview");
  const userPlaceholder = document.getElementById("user-placeholder");
  const userBattlePreview = document.getElementById("user-battle-preview");
  const npcPreview = document.getElementById("npc-preview");
  const userHandLabel = document.getElementById("user-hand-label");
  const npcHandLabel = document.getElementById("npc-hand-label");
  const userScoreEl = document.getElementById("user-score");
  const npcScoreEl = document.getElementById("npc-score");
  const userDetailsEl = document.getElementById("user-details");
  const npcDetailsEl = document.getElementById("npc-details");
  const baseResultEl = document.getElementById("base-result");
  const finalResultEl = document.getElementById("final-result");
  const explainEl = document.getElementById("explain-text");

  const handButtons = document.querySelectorAll(".btn.hand");

  let currentUserImageDataUrl = null; // ユーザーがアップした画像のDataURL

  // アップロードボタン → inputクリック
  uploadBtn.addEventListener("click", () => {
    userFileInput.click();
  });

  // 画像ファイル選択時
  userFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      currentUserImageDataUrl = event.target.result;
      userPreview.src = currentUserImageDataUrl;
      userPreview.style.display = "block";
      userPlaceholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  });

  // グーチョキパーのボタンが押されたとき
  handButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const hand = btn.dataset.hand; // "グー" / "チョキ" / "パー"

      if (!currentUserImageDataUrl) {
        alert("先にあなたのイラスト画像をアップロードしてください。");
        return;
      }

      playRound(hand);
    });
  });

  // 1ラウンド実行
  async function playRound(userHand) {
    resetResult();

    // ユーザー側表示更新
    userHandLabel.textContent = `手：${userHand}`;
    userBattlePreview.src = currentUserImageDataUrl;

    // PCの手をランダム選択
    const npc = npcHands[Math.floor(Math.random() * npcHands.length)];
    npcHandLabel.textContent = `手：${npc.hand}`;
    npcPreview.src = npc.src;

    // 画質スコア評価
    const [userEval, npcEval] = await Promise.all([
      evaluateImage(currentUserImageDataUrl),
      evaluateImage(npc.src),
    ]);

    renderDetails(userScoreEl, userDetailsEl, userEval);
    renderDetails(npcScoreEl, npcDetailsEl, npcEval);

    // じゃんけん本来の結果
    const base = judgeJanken(userHand, npc.hand);
    const baseText =
      base === 1 ? "あなたの勝ち"
      : base === -1 ? "あなたの負け"
      : "あいこ";

    baseResultEl.textContent = `じゃんけん結果：${baseText}`;

    // 画質による逆転ルール
    const diff = userEval.score - npcEval.score;
    let final = base;
    let explain = "";

    if (base === -1) {
      if (diff >= 20) {
        // 負け → 大逆転勝ち
        final = 1;
        explain = `本来は負けでしたが、あなたの画像スコアがPCより${diff}点高いため、大逆転勝ちです！`;
      } else if (diff >= 10) {
        // 負け → 引き分け
        final = 0;
        explain = `本来は負けでしたが、あなたの画像スコアがPCより${diff}点高いため、引き分けになりました。`;
      } else {
        explain = "本来のじゃんけん結果が優先されました。画質では逆転ならず…。";
      }
    } else if (base === 1) {
      if (diff <= -20) {
        // 勝ち → 大逆転負け（PCの圧倒的画質）
        final = -1;
        explain = `じゃんけんには勝ちましたが、PCの画像スコアが${-diff}点も高く、画質で押し切られてしまいました…。`;
      } else if (diff <= -10) {
        // 勝ち → 引き分け
        final = 0;
        explain = `じゃんけんには勝ちましたが、PCの画像スコアが高かったため、引き分け扱いになりました。`;
      } else {
        explain = "じゃんけんも画質も十分！文句なしの勝利です。";
      }
    } else {
      // あいこの場合
      if (diff >= 10) {
        final = 1;
        explain = `じゃんけんはあいこでしたが、画像スコアの差（+${diff}点）で、あなたの勝ちになりました！`;
      } else if (diff <= -10) {
        final = -1;
        explain = `じゃんけんはあいこでしたが、PCの画像スコアの方が高く、PCの勝ちになりました。`;
      } else {
        explain = "じゃんけんも画質も互角でした。ナイスファイト！";
      }
    }

    let finalText, finalClass;
    if (final === 1) {
      finalText = "最終結果：あなたの勝ち！🎉";
      finalClass = "win";
    } else if (final === -1) {
      finalText = "最終結果：あなたの負け…💦";
      finalClass = "lose";
    } else {
      finalText = "最終結果：引き分け！🤝";
      finalClass = "draw";
    }

    finalResultEl.textContent = finalText;
    finalResultEl.classList.add(finalClass);
    explainEl.textContent = explain;
  }

  // 画質スコア評価（解像度＋縦横比）
  function evaluateImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        let score = 50;
        const details = [];

        const minSide = Math.min(w, h);
        const maxSide = Math.max(w, h);
        const ratio = maxSide / minSide;

        details.push(`解像度：${w} × ${h} px`);

        // 解像度評価
        if (minSide >= 1000) {
          score += 20;
          details.push("解像度がとても高く、大きな表示にも向いています。");
        } else if (minSide >= 700) {
          score += 10;
          details.push("解像度は十分で、一般的な用途に問題ありません。");
        } else if (minSide >= 400) {
          details.push("解像度はやや控えめですが、サムネイル用途なら許容範囲です。");
        } else {
          score -= 15;
          details.push("解像度が低く、大きく表示すると粗く見える可能性があります。");
        }

        // 縦横比評価
        if (ratio < 1.2) {
          score += 10;
          details.push("ほぼ正方形で、アイコンなどに使いやすい比率です。");
        } else if (ratio < 1.8) {
          score += 5;
          details.push("標準的な縦横比で、扱いやすい画像です。");
        } else if (ratio < 2.5) {
          details.push("やや細長い縦横比です。場合によってはトリミングも検討できます。");
        } else {
          score -= 5;
          details.push("かなり細長い比率で、用途が限られるかもしれません。");
        }

        // スコア範囲調整
        score = Math.max(0, Math.min(100, score));
        resolve({
          score: Math.round(score),
          details,
        });
      };
      img.src = url;
    });
  }

  // じゃんけん判定：ユーザー視点で 1=勝ち, 0=あいこ, -1=負け
  function judgeJanken(userHand, npcHand) {
    if (userHand === npcHand) return 0;

    if (
      (userHand === "グー" && npcHand === "チョキ") ||
      (userHand === "チョキ" && npcHand === "パー") ||
      (userHand === "パー" && npcHand === "グー")
    ) {
      return 1;
    }
    return -1;
  }

  function renderDetails(scoreEl, listEl, evalResult) {
    scoreEl.textContent = `スコア：${evalResult.score}`;
    listEl.innerHTML = "";
    evalResult.details.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      listEl.appendChild(li);
    });
  }

  function resetResult() {
    finalResultEl.textContent = "最終結果：--";
    finalResultEl.classList.remove("win", "lose", "draw");
    baseResultEl.textContent = "じゃんけん結果：--";
    explainEl.textContent = "";
    userScoreEl.textContent = "スコア：--";
    npcScoreEl.textContent = "スコア：--";
    userDetailsEl.innerHTML = "";
    npcDetailsEl.innerHTML = "";
  }
});
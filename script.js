// PC側のグーチョキパー画像（今時点では固定の3枚の画像）
const npcHands = [
  { hand: "グー", src: "npc-images/gu.png" },
  { hand: "チョキ", src: "npc-images/choki.png" },
  { hand: "パー", src: "npc-images/pa.png" },
];

// ★ ユーザー画像を保存する localStorage のキー
const STORAGE_KEYS = {
  グー: "userImage_gu",
  チョキ: "userImage_choki",
  パー: "userImage_pa",
};

document.addEventListener("DOMContentLoaded", () => {
  // === DOM要素取得 ===
  const btnUploadGu = document.getElementById("btn-upload-gu");
  const btnUploadChoki = document.getElementById("btn-upload-choki");
  const btnUploadPa = document.getElementById("btn-upload-pa");

  const fileGu = document.getElementById("file-gu");
  const fileChoki = document.getElementById("file-choki");
  const filePa = document.getElementById("file-pa");

  const previewGu = document.getElementById("preview-gu");
  const previewChoki = document.getElementById("preview-choki");
  const previewPa = document.getElementById("preview-pa");

  const phGu = document.getElementById("ph-gu");
  const phChoki = document.getElementById("ph-choki");
  const phPa = document.getElementById("ph-pa");

    // ★ 手ごとのプレビュー/プレースホルダーをマップで扱えるようにする
  const previewMap = {
    グー: previewGu,
    チョキ: previewChoki,
    パー: previewPa,
  };

  const placeholderMap = {
    グー: phGu,
    チョキ: phChoki,
    パー: phPa,
  };

  const readyIndicator = document.getElementById("ready-indicator");
  const handButtons = document.querySelectorAll(".btn-hand");

  const userHandLabel = document.getElementById("user-hand-label");
  const npcHandLabel = document.getElementById("npc-hand-label");
  const userBattlePreview = document.getElementById("user-battle-preview");
  const npcPreview = document.getElementById("npc-preview");
  const userScoreEl = document.getElementById("user-score");
  const npcScoreEl = document.getElementById("npc-score");
  const userDetailsEl = document.getElementById("user-details");
  const npcDetailsEl = document.getElementById("npc-details");
  const baseResultEl = document.getElementById("base-result");
  const finalResultEl = document.getElementById("final-result");
  const explainEl = document.getElementById("explain-text");

  // === ユーザーがセットした3枚の画像(DataURL)を保持するオブジェクト ===
  const userImages = {
    グー: null,
    チョキ: null,
    パー: null,
  };

  // ★ ⭐️ページ読み込み時に localStorage から画像を復元
  function loadImagesFromStorage() {
    ["グー", "チョキ", "パー"].forEach((handKey) => {
      const storageKey = STORAGE_KEYS[handKey];
      const dataUrl = localStorage.getItem(storageKey);
      if (!dataUrl) return; // 保存がなければスキップ

      // Local Storageの画像をuserImages にセット
      userImages[handKey] = dataUrl;

      // プレビュー表示
      const previewEl = previewMap[handKey];
      const placeholderEl = placeholderMap[handKey];
      previewEl.src = dataUrl;
      previewEl.style.display = "block";
      if (placeholderEl) placeholderEl.style.display = "none";
    });

    // セット状況に応じてボタン有効化/メッセージ更新
    checkReady();
  }

  // --- アップロードボタンからinputを開く ---
  btnUploadGu.addEventListener("click", () => fileGu.click());
  btnUploadChoki.addEventListener("click", () => fileChoki.click());
  btnUploadPa.addEventListener("click", () => filePa.click());

  // 各手ごとのファイル選択処理（この部分が汎用化のための重要な処理）
  // handleUpload (対象の手, どの <input type="file"> からファイルを取ればいいか, どの <img> にプレビューを表示するか, その後削除するプレースホルダー要素)
  fileGu.addEventListener("change", () => handleUpload("グー", fileGu, previewGu, phGu));
  fileChoki.addEventListener("change", () =>
    handleUpload("チョキ", fileChoki, previewChoki, phChoki)
  );
  filePa.addEventListener("change", () => handleUpload("パー", filePa, previewPa, phPa));

  // 汎用処理（アップロード、ローカルファイルへの保存、プレビュー表示更新、状態更新）
  // 汎用アップロード処理
  function handleUpload(handKey, inputEl, previewEl, placeholderEl) {
    const file = inputEl.files[0];
    if (!file) return; // キャンセルされた場合
    if (!file.type.startsWith("image/")) { // 画像ファイル以外の場合
      alert("画像ファイルを選択してください。");
      return;
    }

    const reader = new FileReader(); // ローカルファイルをDataURLとして読み込む
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      // (e)の意味は不明だけども、ファイルをアップロードするときおおまじない

      // メモリ上の状態を更新
      userImages[handKey] = dataUrl;

      // ★ ⭐️User　Imagesに選択した画像を保存
      const storageKey = STORAGE_KEYS[handKey];
      // ★ ⭐️localStorage に保存
      localStorage.setItem(storageKey, dataUrl);

      // プレビュー表示更新
      previewEl.src = dataUrl;
      previewEl.style.display = "block";
      placeholderEl.style.display = "none";

      checkReady();
      resetResult();
    };
    reader.readAsDataURL(file);
  }

  // 3枚揃ったら準備OK & じゃんけんボタンを有効化
  function checkReady() {
    const allSet = Object.values(userImages).every((v) => Boolean(v)); 
    // Boolean(v) は null/undefined/空文字を false に変換、何かしらの文字が入っていると true に変換
    // allSet は3枚すべて画像がセットされているかどうかの真偽値(3枚すべてなら true, 1枚でも欠けていれば false)
    if (allSet) {
      readyIndicator.textContent = "準備OK！お好きな手でPCと勝負してみましょう。";
      handButtons.forEach((btn) => (btn.disabled = false)); // じゃんけんボタンを有効化
    } else {
      const remain = Object.values(userImages).filter((v) => !v).length;
      // .filter((v) => !v) は「まだ null のものだけを集めた配列」を返してくれる。なぜなら!v は null/undefined/空文字を false に変換されるから。
      // .lengthはその配列の要素数、つまり「まだセットされていない画像の枚数」を返す
      // 結果、remain はまだセットされていない画像の枚数
      readyIndicator.textContent = `準備中：あと ${remain} 枚画像をセットしてください。`;
      handButtons.forEach((btn) => (btn.disabled = true)); // じゃんけんボタンを無効化
    }
  }

  // じゃんけんボタンのクリック
  handButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const hand = btn.dataset.hand; // "グー" / "チョキ" / "パー"
      const imgUrl = userImages[hand];
      if (!imgUrl) {
        alert("この手の画像がまだセットされていません。");
        return;
      }
      playRound(hand, imgUrl);
    });
  });

  // 1ラウンド実行
  async function playRound(userHand, userImgUrl) {
    resetResult();

    // あなた側表示
    userHandLabel.textContent = `手：${userHand}`;
    userBattlePreview.src = userImgUrl;

    // PCの手をランダム選択
    const npc = npcHands[Math.floor(Math.random() * npcHands.length)];
    npcHandLabel.textContent = `手：${npc.hand}`;
    npcPreview.src = npc.src;

    // 画質評価
    const [userEval, npcEval] = await Promise.all([
      evaluateImage(userImgUrl),
      evaluateImage(npc.src),
    ]);

    renderDetails(userScoreEl, userDetailsEl, userEval);
    renderDetails(npcScoreEl, npcDetailsEl, npcEval);

    // 素のじゃんけん結果
    const base = judgeJanken(userHand, npc.hand);
    const baseText =
      base === 1 ? "あなたの勝ち"
      : base === -1 ? "あなたの負け"
      : "あいこ";
    baseResultEl.textContent = `じゃんけん結果：${baseText}`;

    // 画質による逆転ロジック
    const diff = userEval.score - npcEval.score;
    let final = base;
    let explain = "";

    if (base === -1) {
      // 本来負け
      if (diff >= 20) {
        final = 1;
        explain = `本来は負けでしたが、あなたの画像スコアがPCより${diff}点高く、大逆転勝ちです！`;
      } else if (diff >= 10) {
        final = 0;
        explain = `本来は負けでしたが、画像スコアがPCより${diff}点高く、引き分け扱いになりました。`;
      } else {
        explain = "画質の差では逆転できませんでした。次の一枚に期待…！";
      }
    } else if (base === 1) {
      // 本来勝ち
      if (diff <= -20) {
        final = -1;
        explain = `じゃんけんには勝ちましたが、PCの画像スコアが${-diff}点高く、画質で押し切られてしまいました…。`;
      } else if (diff <= -10) {
        final = 0;
        explain = `じゃんけんには勝ったものの、PCの画像スコアが高かったため、引き分け扱いになりました。`;
      } else {
        explain = "じゃんけんも画質もあなたの勝ち！文句なしの勝利です。";
      }
    } else {
      // あいこ
      if (diff >= 10) {
        final = 1;
        explain = `じゃんけんはあいこでしたが、画像スコアの差（+${diff}点）であなたの勝ちになりました！`;
      } else if (diff <= -10) {
        final = -1;
        explain = `じゃんけんはあいこでしたが、PCの画像スコアの方が高く、PCの勝ちになりました。`;
      } else {
        explain = "じゃんけんも画質も互角でした。いい勝負！";
      }
    }

    // 最終結果表示
    let finalText;
    let finalClass;
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

  // 画像の画質スコア評価（解像度＋縦横比）
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
          details.push("やや細長い縦横比です。用途によってはトリミングも検討できます。");
        } else {
          score -= 5;
          details.push("かなり細長い比率で、用途が限られるかもしれません。");
        }

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
    baseResultEl.textContent = "じゃんけん結果：--";
    finalResultEl.textContent = "最終結果：--";
    finalResultEl.classList.remove("win", "lose", "draw");
    explainEl.textContent = "";
    userScoreEl.textContent = "スコア：--";
    npcScoreEl.textContent = "スコア：--";
    userDetailsEl.innerHTML = "";
    npcDetailsEl.innerHTML = "";
  }

   // ★ 最後に既存データを読み込む
  loadImagesFromStorage();

});
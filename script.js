// 视频文字只播放一次；完整文本始终提供给辅助技术。
const promptText = document.querySelector("#video-prompt");
if (promptText) {
  const fullText = promptText.textContent;
  const panel = document.querySelector(".video-prompt-panel");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer;
  const finish = () => {
    clearTimeout(timer);
    promptText.textContent = fullText;
    panel.classList.remove("is-typing");
  };
  if (!reducedMotion.matches) {
    let position = 0;
    promptText.textContent = "";
    panel.classList.add("is-typing");
    const typeNext = () => {
      position += 1;
      promptText.textContent = fullText.slice(0, position);
      if (position < fullText.length) timer = setTimeout(typeNext, 20);
      else finish();
    };
    typeNext();
  }
  reducedMotion.addEventListener("change", event => {
    if (event.matches) finish();
  });
}

const video = document.querySelector("video");
if (video) {
  video.addEventListener("error", () => {
    document.querySelector(".video-error").hidden = false;
  });
}

const frame = document.querySelector(".mesh-frame");
if (frame) {
  const status = document.querySelector(".mesh-status");
  window.addEventListener("message", event => {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.type === "mesh-ready") {
      frame.dataset.ready = "true";
      status.textContent = event.data.mobile
        ? "三个原始视图已纵向排列；可使用原有工具旋转与缩放。"
        : "原有数据展示已加载；可拖动模型旋转，并使用原有工具缩放。";
    } else if (event.data?.type === "mesh-error") {
      status.textContent = "三维展示未能加载。原文件依赖在线 Plotly CDN，请检查网络后刷新。";
    }
  });
}
// 保留原有 Plotly 数据与工具，仅调整外层尺寸和三个视图的位置。
const graph = document.querySelector(".plotly-graph-div");
if (graph) {
  let resizeTimer;
  const adaptPlot = async () => {
    try {
      const original = window;
      if (!original.Plotly || !graph?.data) {
        window.parent.postMessage({ type: "mesh-error" }, "*");
        return;
      }
      if (!original.document.getElementById("responsive-wrapper-style")) {
        const style = original.document.createElement("style");
        style.id = "responsive-wrapper-style";
        style.textContent = `html,body{margin:0;width:100%;height:100%;overflow:hidden}
          body>div{width:100%!important;height:100%!important}
          @media(max-width:700px){.modebar{display:flex!important;flex-wrap:wrap;justify-content:flex-end;max-width:100%}.modebar-group{float:none!important}}`;
        original.document.head.append(style);
      }
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const annotations = graph.layout.annotations.map((item, index) => ({
        ...item,
        x: mobile ? 0.5 : (index + 0.5) / 3,
        y: mobile ? [1, 0.66, 0.32][index] : 1
      }));
      const domains = mobile
        ? [{x:[0,1],y:[0.69,1]}, {x:[0,1],y:[0.35,0.65]}, {x:[0,1],y:[0,0.31]}]
        : [{x:[0,0.3266666667],y:[0,1]}, {x:[0.3366666667,0.6633333333],y:[0,1]}, {x:[0.6733333333,1],y:[0,1]}];
      await original.Plotly.relayout(graph, {
        width: window.innerWidth,
        height: window.innerHeight,
        "scene.domain": domains[0],
        "scene2.domain": domains[1],
        "scene3.domain": domains[2],
        annotations,
        "margin.t": mobile ? 150 : 70,
        "margin.b": mobile ? 140 : 0,
        "legend.orientation": mobile ? "h" : "v",
        "legend.x": mobile ? 0 : 1.02,
        "legend.y": mobile ? -0.07 : 1,
        "title.text": mobile ? "Feature segment to<br>large-scale key curve" : "Feature segment to large-scale key curve",
        "title.font.size": mobile ? 14 : 17
      });
      window.parent.postMessage({ type: "mesh-ready", mobile }, "*");
    } catch (error) {
      window.parent.postMessage({ type: "mesh-error" }, "*");
      console.error(error);
    }
  };
  adaptPlot();
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(adaptPlot, 150);
  });
}

if (document.body.classList.contains("todo-page")) {
  setTimeout(() => window.location.replace("experience.html"), 1500);
}



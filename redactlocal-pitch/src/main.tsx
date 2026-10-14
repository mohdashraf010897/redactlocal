import { mount } from "./engine";
import { fontFaces } from "./kit/theme";
import { compositions } from "./compositions";

const style = document.createElement("style");
style.textContent = fontFaces;
document.head.appendChild(style);
mount(compositions);

if (__DEV__) new EventSource("/esbuild").addEventListener("change", () => location.reload());

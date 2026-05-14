export type FormatCommand =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "fontName"; value: string }
  | { type: "fontSize"; value: string }
  | { type: "foreColor"; value: string }
  | { type: "justifyLeft" }
  | { type: "justifyCenter" }
  | { type: "justifyRight" };

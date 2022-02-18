/*
 change for npm modules.
 by Luiz Estácio.
 json-format v.1.1
 http://github.com/phoboslab/json-format
 Released under MIT license:
 http://www.opensource.org/licenses/mit-license.php
 */
let p = [];
const indentConfig = {
  tab: { char: "\t", size: 1 },
  space: { char: " ", size: 4 },
};
const configDefault = {
  type: "tab",
};
const push = function (m) {
  return "\\" + p.push(m) + "\\";
};
const pop = function (m, i) {
  return p[i - 1];
};
const tabs = function (count, indentType) {
  return new Array(count + 1).join(indentType);
};

function JSONFormat(json, indentType) {
  p = [];
  let out = "";
  let indent = 0;

  // Extract backslashes and strings
  json = json
    .replace(/\\./g, push)
    .replace(/(".*?"|'.*?')/g, push)
    .replace(/\s+/, "");

  // Indent and insert newlines
  for (let i = 0; i < json.length; i++) {
    const c = json.charAt(i);

    switch (c) {
      case "{":
      case "[":
        out += c + "\n" + tabs(++indent, indentType);
        break;
      case "}":
      case "]":
        out += "\n" + tabs(--indent, indentType) + c;
        break;
      case ",":
        out += ",\n" + tabs(indent, indentType);
        break;
      case ":":
        out += ": ";
        break;
      default:
        out += c;
        break;
    }
  }

  // Strip whitespace from numeric arrays and put backslashes
  // and strings back in
  out = out
    .replace(/\[[\d,\s]+?\]/g, function (m) {
      return m.replace(/\s/g, "");
    })
    .replace(/\\(\d+)\\/g, pop) // strings
    .replace(/\\(\d+)\\/g, pop); // backslashes in strings

  return out;
}

module.exports = function (json, config) {
  config = config || configDefault;
  const indent = indentConfig[config.type];

  if (indent == null) {
    throw new Error('Unrecognized indent type: "' + config.type + '"');
  }
  const indentType = new Array((config.size || indent.size) + 1).join(
    indent.char
  );
  return JSONFormat(JSON.stringify(json), indentType);
};

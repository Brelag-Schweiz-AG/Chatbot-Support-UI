import { marked } from "marked";

export const checkShowContactForm = (
  response: string
): { showForm: boolean; parsedResponse: string } => {
  // Parse if {{ SHOW_CONTACT_FORM }} is present in response and remove it from response
  const escapedKey = "\\{\\{SHOW_CONTACT_FORM\\}\\}";
  const unescapedKey = "{{SHOW_CONTACT_FORM}}";

  // Check for either escaped or unescaped key
  const showForm =
    response.includes(escapedKey) || response.includes(unescapedKey);

  // Remove both variants from the response
  // To replace the escaped key, we need to escape the escape character
  const escapedEscapedKey = "\\\\{\\\\{SHOW_CONTACT_FORM\\\\}\\\\}";
  let parsedResponse = response.replace(new RegExp(escapedEscapedKey, "g"), "");
  parsedResponse = parsedResponse.replace(new RegExp(unescapedKey, "g"), "");
  return { showForm, parsedResponse };
};

export const processChatGPTResponse = async (
  response: string
): Promise<string> => {
  // Linkify PDF names
  try {
    response = linkifyPDFNames(response);
  } catch (error) {
    console.log("Error while linkifying PDF names:", error);
    // Continue
  }

  // Use marked to convert Markdown to HTML
  const html = await marked.parse(response);

  return html;
};

const linkifyPDFNames = (inputText: string): string => {
  // Initialize an array to hold the sources
  let sources: Set<string> = new Set();

  // Define a regular expression to match the (Source: ... ) pattern
  let sourcePatterns = [/\(Source:[^\)]+\)/g, /\(Quelle:[^\)]+\)/g];

  for (let sourcePattern of sourcePatterns) {
    // Find all matches in the input text
    let matches;
    while ((matches = sourcePattern.exec(inputText)) !== null) {
      // Add the match to the sources array
      sources.add(matches[0]);
    }

    // Remove all (Source: ... ) patterns from the input text
    inputText = inputText.replace(sourcePattern, "");
  }

  console.log("Sources found:");
  console.log(sources);
  console.log("Cleaned text:");
  console.log(inputText);

  if (sources.size > 0) {
    inputText += "<br><br>Quellen:<br>";
    sources.forEach((subText) => {
      // Extract the substring between the last / and __
      let startIndex = subText.lastIndexOf("/") + 1;
      if (startIndex === 0) {
        // Possible that the link is in the format (Quelle: <folder>__<filename>.pdf)
        startIndex = subText.indexOf(":") + 1;
      }
      let endIndex = subText.indexOf("__", startIndex);
      let folder = subText.substring(startIndex, endIndex);
      // Clear whitespace
      folder = folder.trim();

      let newText = "";
      if (folder.startsWith("@")) {
        // Remove @ symbol
        folder = folder.substring(1);
        newText = `<a href="https://www.brelag.com/${folder}" target="_blank">Webseite <span class="mdi mdi-file-pdf-box"></span></a>`;
      } else {
        // Extract the substring after __ and before )
        startIndex = subText.indexOf("__") + 2;
        endIndex = subText.indexOf(")", startIndex);
        let filename = subText.substring(startIndex, endIndex);
        // Clear whitespace
        filename = filename.trim();

        // Create markdown link
        newText = `<a href="https://drive.google.com/drive/folders/${folder}" target="_blank">${filename} <span class="mdi mdi-file-pdf-box"></span></a>`;
      }

      inputText += newText + "<br>";
    });
  }

  return inputText;
};

const old_linkifyPDFNames = (text: string): string => {
  // sample text: "(Quelle: azureml://locations/switzerlandnorth/workspaces/8fa915ff-765f-47cd-8d2d-605decf9e9b0/data/Anleitungen_DominoSwiss/versions/1/1n3Xt40gg5STAOuCOKV2IiXjzgxEAPFta__Dominoswiss MX FE ULTRA_Produktblatt_Brelag Schweiz AG.pdf)."

  // Check if text contains "(Quelle: ...)" pattern
  if (text.includes("(Quelle:") || text.includes("(Source:")) {
    // Use substring in case of multiple sources
    const subTextStartIndex = Math.min(
      text.indexOf("(Quelle:") !== -1 ? text.indexOf("(Quelle:") : Infinity,
      text.indexOf("(Source:") !== -1 ? text.indexOf("(Source:") : Infinity
    );
    const subTextEndIndex = text.indexOf("pdf).") + 4;
    const subText = text.substring(subTextStartIndex, subTextEndIndex);

    // Extract the substring between the last / and __
    let startIndex = subText.lastIndexOf("/") + 1;
    if (startIndex === 0) {
      // Possible that the link is in the format (Quelle: <folder>__<filename>.pdf)
      startIndex = subText.indexOf(":") + 1;
    }
    let endIndex = subText.indexOf("__", startIndex);
    let folder = subText.substring(startIndex, endIndex);
    // Clear whitespace
    folder = folder.trim();

    let newText = "";
    console.log({ folder });
    if (folder.startsWith("@")) {
      newText = `<a href="https://www.brelag.com/${folder}" target="_blank">(Webseite <span class="mdi mdi-file-pdf-box"></span>)</a>`;
    } else {
      // Extract the substring after __ and before )
      startIndex = subText.indexOf("__") + 2;
      endIndex = subText.indexOf(")", startIndex);
      let filename = subText.substring(startIndex, endIndex);
      // Clear whitespace
      filename = filename.trim();

      // Create markdown link
      newText = `<a href="https://drive.google.com/drive/folders/${folder}" target="_blank">(${filename} <span class="mdi mdi-file-pdf-box"></span>)</a>`;
    }

    // Delete everything in original link between subTextStartIndex and subTextEndIndex
    text =
      text.substring(0, subTextStartIndex) + text.substring(subTextEndIndex);
    // Put newText at position subTextStartIndex
    text =
      text.slice(0, subTextStartIndex) +
      newText +
      text.slice(subTextStartIndex);

    // Check recursively if another Source present in the text
    return linkifyPDFNames(text);
  }

  return text;
};

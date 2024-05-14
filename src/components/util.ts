import { marked } from 'marked';

export const checkShowContactForm = (response: string): {showForm: boolean, parsedResponse: string} => {
  // Parse if {{ SHOW_CONTACT_FORM }} is present in response and remove it from response
  const showForm = response.includes('{{SHOW_CONTACT_FORM}}');
  const parsedResponse = response.replace('{{SHOW_CONTACT_FORM}}', '');
  return { showForm, parsedResponse };
}

export const processChatGPTResponse = async (response: string): Promise<string> => {
  // Linkify PDF names
  try {
    response = linkifyPDFNames(response);
  } catch (error) {
    console.log('Error while linkifying PDF names:', error)
    // Continue
  }

  // Use marked to convert Markdown to HTML
  const html = await marked.parse(response);

  return html;
};

const linkifyPDFNames = (text: string): string => {
  // sample text: "(Source: azureml://locations/switzerlandnorth/workspaces/8fa915ff-765f-47cd-8d2d-605decf9e9b0/data/Anleitungen_DominoSwiss/versions/1/1n3Xt40gg5STAOuCOKV2IiXjzgxEAPFta__Dominoswiss MX FE ULTRA_Produktblatt_Brelag Schweiz AG.pdf)."

  // Check if text contains "(Source: ...)" pattern
  if (text.includes('(Source:')) {
    // Use substring in case of multiple sources
    const subTextStartIndex = text.indexOf('(Source:')
    const subTextEndIndex = text.indexOf('pdf).') + 4
    const subText = text.substring(subTextStartIndex, subTextEndIndex);
    console.log(subText)

    // Extract the substring between the last / and __
    let startIndex = subText.lastIndexOf('/') + 1;
    if (startIndex === 0) {
      // Possible that the link is in the format (Source: <folder>__<filename>.pdf)
      startIndex = subText.indexOf(':') + 1;
    }
    let endIndex = subText.indexOf('__', startIndex);
    let folder = subText.substring(startIndex, endIndex);
    // Clear whitespace
    folder = folder.trim();

    // Extract the substring after __ and before )
    startIndex = subText.indexOf('__') + 2;
    endIndex = subText.indexOf(')', startIndex);
    let filename = subText.substring(startIndex, endIndex);
    // Clear whitespace
    filename = filename.trim();

    // Create markdown link
    const newText = `<a href="https://drive.google.com/drive/folders/${folder}" target="_blank">(${filename} <span class="mdi mdi-file-pdf-box"></span>)</a>`

    // Delete everything in original link between subTextStartIndex and subTextEndIndex
    text = text.substring(0, subTextStartIndex) + text.substring(subTextEndIndex);
    // Put newText at position subTextStartIndex
    text = text.slice(0, subTextStartIndex) + newText + text.slice(subTextStartIndex);

    // Check recursively if another Source present in the text
    return linkifyPDFNames(text);
  }

  return text;
};

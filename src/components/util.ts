import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { DocumentSource, documentSources } from './documentSources';

export const checkShowContactForm = (response: string): boolean => {
  if (response === '{{SHOW_CONTACT_FORM}}') {
    return true;
  }
  return false;
}

export const processChatGPTResponse = async (response: string): Promise<string> => {
  // Linkify PDF names
  response = linkifyPDFNames(response, documentSources);

  // Use marked to convert Markdown to HTML
  let html = await marked.parse(response);

  // Sanitize the HTML
  html = DOMPurify.sanitize(html);
  return html;
};

const linkifyPDFNames = (text: string, sources: DocumentSource) => {
  Object.entries(sources).forEach(([fileName, url]) => {
    const escapedFileName = fileName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape special regex characters
    const regex = new RegExp(escapedFileName, 'g');
    text = text.replace(regex, `[${fileName} <span class="mdi mdi-file-pdf-box"></span>](${url})`);
  });
  return text;
};

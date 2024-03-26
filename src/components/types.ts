export type MessageHistory = {
  inputs: {
    chat_input: string;
  };
  outputs: {
    chat_output?: string;
  };
}[]

export type Product = {
  name: string;
  description: string;
  imageSrc: string;
}

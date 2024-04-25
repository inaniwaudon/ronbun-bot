import { Bindings } from "./bindings";

export const createDOIResponseMessage = async (
  interaction: any,
  env: Bindings,
) => {
  const doi: string = interaction.data.options.find(
    (option: any) => option.name === "doi",
  ).value;
  try {
    const response = await fetch(
      `${env.GAS_URL}?doi=${doi}&interactionToken=${interaction.token}`,
    );
    const data = (await response.json()) as {
      title: string;
      doi: string;
      result: string;
    };
    return data;
  } catch (e) {
    return `Error occurred in GAS\n${e}`;
  }
};

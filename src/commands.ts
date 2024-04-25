import {
  ApplicationCommandOptionType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";

export const DOI_COMMAND: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: "doi",
  description: "DOI を与えると，その論文の概要を返します",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "doi",
      description: "論文の DOI",
      required: true,
    },
  ],
};

// import {
//   CREDIT_TOKEN_ID,
//   LEO_HASH_PROGRAM,
//   ROOT_PATH,
//   ZERO_ADDRESS,
// } from "@/const";
// import { exec } from "child_process";
// import { existsSync, readFileSync, writeFileSync } from "fs";

// namespace LeoProgramManager {
//   const LEO_PROGRAM_NAME = "hashing_program";

//   export async function init() {
//     return new Promise((resolve, reject) => {
//       const programPath = `${ROOT_PATH}/${LEO_PROGRAM_NAME}`;
//       if (!existsSync(programPath)) {
//         exec(
//           `leo new --home ${ROOT_PATH} ${LEO_PROGRAM_NAME}`,
//           (error, stdout, stderr) => {
//             if (error) {
//               console.log(`${error}`);
//               reject(error);
//               return;
//             }
//             if (stderr) {
//               console.log(`${stderr}`);
//               reject(stderr);
//               return;
//             }
//             resolve("");
//           }
//         );
//       } else {
//         console.log("leo program already exists");
//         resolve("");
//       }
//     });
//   }

//   export function writeProgram(address: string, tokenId: string) {
//     writeFileSync(
//       `${ROOT_PATH}/hashing_program/src/main.leo`,
//       LEO_HASH_PROGRAM.replace(ZERO_ADDRESS, address).replace(
//         CREDIT_TOKEN_ID,
//         tokenId
//       )
//     );
//   }

//   export async function executeAndGetFieldHashed(): Promise<string> {
//     return new Promise((resolve, reject) => {
//       exec(
//         `leo build --network testnet --path ${ROOT_PATH}/hashing_program`,
//         (error, stdout, stderr) => {
//           if (error) {
//             console.log(`${error}`);
//             reject(error);
//             return;
//           }
//           if (stderr) {
//             console.log(`${stderr}`);
//             reject(stderr);
//             return;
//           }

//           //get hash from build result
//           let buildResult = readFileSync(
//             `${ROOT_PATH}/hashing_program/build/main.aleo`
//           ).toString();

//           let hash = buildResult
//             .slice(
//               buildResult.indexOf("output"),
//               buildResult.indexOf("field.private")
//             )
//             .replace("as", "")
//             .replace("output", "")
//             .trim();

//           resolve(hash);
//         }
//       );
//     });
//   }
// }

// export default LeoProgramManager;

export const ROOT_PATH = process.cwd();

export const ZERO_ADDRESS =
  "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";
export const CREDIT_TOKEN_ID =
  "3443843282313283355522573239085696902919850365217539366784739393210722344986field";
export const LEO_HASH_PROGRAM = `
program hashing_program.aleo {
    struct BalanceKey {
        wallet_address: address,
        token_id: field,
    }

    transition main () -> field {
       return BHP256::hash_to_field(BalanceKey {
            wallet_address: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
            token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field
       });
    }
}`;

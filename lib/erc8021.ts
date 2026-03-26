import { encodeFunctionData, concatHex, type Hex } from "viem";
import { Attribution } from "ox/erc8021";

// Builder code — 本番環境で取得した実際のコードに置き換えてください
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || "";

export function getBuilderSuffix(): Hex | null {
  if (!BUILDER_CODE) return null;
  return Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) as Hex;
}

export function prepareTransaction(
  abi: readonly unknown[],
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
  to: `0x${string}`
): { to: `0x${string}`; data: Hex } {
  const calldata = encodeFunctionData({
    abi,
    functionName,
    args,
  } as Parameters<typeof encodeFunctionData>[0]);

  const suffix = getBuilderSuffix();
  const data = suffix ? concatHex([calldata, suffix]) : calldata;

  return { to, data };
}

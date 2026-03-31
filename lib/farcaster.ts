"use client";

import { useEffect, useState, useRef } from "react";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface CastContext {
  hash: string;
  fid?: number;
}

interface FarcasterState {
  isInMiniApp: boolean;
  isLoading: boolean;
  user: FarcasterUser | null;
  castContext: CastContext | null;
  farcasterAddress: string | null;
}

export function useFarcasterMiniApp(): FarcasterState {
  const [state, setState] = useState<FarcasterState>({
    isInMiniApp: false,
    isLoading: true,
    user: null,
    castContext: null,
    farcasterAddress: null,
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    import("@farcaster/miniapp-sdk")
      .then(async ({ sdk }) => {
        const isMiniApp = await sdk.isInMiniApp();
        if (!isMiniApp) {
          setState({
            isInMiniApp: false,
            isLoading: false,
            user: null,
            castContext: null,
            farcasterAddress: null,
          });
          return;
        }

        // Farcaster のスプラッシュ画面を消す
        sdk.actions.ready();

        // Farcaster ウォレットを window.ethereum に公開し、アドレスを取得
        let farcasterAddress: string | null = null;
        try {
          const ethProvider = await sdk.wallet.getEthereumProvider();
          if (ethProvider && typeof window !== "undefined") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).ethereum = ethProvider;
            const accounts = await ethProvider.request({
              method: "eth_requestAccounts",
            }) as string[];
            farcasterAddress = accounts[0] ?? null;
          }
        } catch {
          // ウォレットプロバイダー非対応
        }

        // ユーザープロフィール取得
        let user: FarcasterUser | null = null;
        let castContext: CastContext | null = null;

        try {
          const context = await sdk.context;
          if (context?.user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u = context.user as any;
            user = {
              fid: u.fid,
              username: u.username,
              displayName: u.displayName,
              pfpUrl: u.pfpUrl,
            };
          }

          // Cast embed から起動された場合の cast 情報
          if (
            context?.location?.type === "cast_embed" &&
            "cast" in context.location
          ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cast = (context.location as any).cast;
            if (cast?.hash) {
              castContext = {
                hash: cast.hash,
                fid: cast.author?.fid,
              };
            }
          }
        } catch {
          // コンテキスト取得不可
        }

        setState({ isInMiniApp: true, isLoading: false, user, castContext, farcasterAddress });
      })
      .catch(() => {
        // SDK 読み込み失敗 → Farcaster 環境ではない
        setState({
          isInMiniApp: false,
          isLoading: false,
          user: null,
          castContext: null,
          farcasterAddress: null,
        });
      });
  }, []);

  return state;
}

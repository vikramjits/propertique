import { useUser } from "@clerk/nextjs";
import { Image } from "next/dist/client/image-component";
import { UserButton } from "@clerk/nextjs";

import { api } from "~/utils/api";

import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import LoadingSpinner, { LoadingPage } from "~/components/loading";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import PostView from "~/components/postview";


dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user, isLoaded } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.post.getAll.invalidate();
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) toast.error(errorMessage[0]);
    },
  });

  if (!user) return null;
  if (!isLoaded) return <div />;

  return (
    <div className="flex w-full gap-3">
      <input
        placeholder="type some emoji"
        className="grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "" && !isPosting) {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

//helper


const Feed = () => {
  const { data, isLoading } = api.post.getAll.useQuery();
  if (isLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <div className="flex w-full max-h-fit flex-col border-x  md:max-w-2xl">
      {[...data]?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export default function Home() {
  api.post.getAll.useQuery();
  return (
    <>
      <header className="flex justify-center">
        <div className="flex w-full gap-4 border-x border-b border-slate-400 p-4 md:max-w-2xl">
          <div>
            <UserButton afterSignOutUrl="/" />
          </div>
          <CreatePostWizard />
        </div>
      </header>
      <main className="flex h-fit justify-center overflow-y-auto">
        <Feed />
      </main>
    </>
  );
}

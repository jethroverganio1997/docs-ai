// app/dashboard/error.tsx
"use client";
import { ErrorState } from "../../../components/error-state";

 // This is a required directive

export default function DocsError({
   error,
 }: {
   error: Error & { digest?: string };
 }) {
   console.log(error.message);
   return (
     <ErrorState
       title="Something went wrong"
       description={error.message}
       errorCode="ERR_500"
     />
   );
 }
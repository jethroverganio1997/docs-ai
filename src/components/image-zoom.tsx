// "use client";
// import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
// import { cn } from "@/lib/utils";
// import Image from "next/image";

// interface ImageZoomProps {
//   src: string;
//   alt: string;
//   className?: string;
//   zoomedClassName?: string;
//   children: React.ReactNode;
//   width?: number;
//   height?: number;
// }

// export function ImageZoom({
//   src,
//   alt,
//   className,
//   children,
//   zoomedClassName,
//   width,
//   height,
//   ...props
// }: ImageZoomProps) {
//   return (
//     <Dialog>
//       <DialogTrigger asChild>{children}</DialogTrigger>
//       <DialogContent
//         className={cn(
//           "max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent shadow-none",
//           zoomedClassName
//         )}
//       >
//         <div className="relative">
//           <Image
//             src={src || "/placeholder.svg"}
//             alt={alt}
//             className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
//           />
//           <button
//             className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
//             onClick={(e) => {
//               e.preventDefault();
//               const dialog = e.currentTarget.closest(
//                 '[data-slot="dialog-content"]'
//               );
//               const closeButton = dialog?.querySelector(
//                 '[data-slot="dialog-close"]'
//               ) as HTMLButtonElement;
//               closeButton?.click();
//             }}
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="16"
//               height="16"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <path d="m18 6-12 12" />
//               <path d="m6 6 12 12" />
//             </svg>
//             <span className="sr-only">Close</span>
//           </button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

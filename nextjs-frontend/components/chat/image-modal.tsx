"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface ImageModalProps {
  selectedImage: string | null
  onClose: () => void
  onDownload: (imageUrl: string, content?: string) => void
}

export function ImageModal({ selectedImage, onClose, onDownload }: ImageModalProps) {
  if (!selectedImage) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-5xl max-h-[90vh] w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -top-12 right-0 flex items-center gap-2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDownload(selectedImage, "")}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <motion.img
            layoutId={`image-${selectedImage}`}
            src={selectedImage}
            alt="Full size document image"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Image } from "lucide-react";

const ResourceCard = ({ resource }) => {
  const navigate = useNavigate();
  const images = resource?.images || [];

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const openImage = (index = 0) => {
    setImageIndex(index);
    setShowImageModal(true);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200 p-3 h-full flex flex-col">
        {/* Image */}
        {images.length ? (
          <button
            onClick={() => openImage(0)}
            className="w-full h-40 rounded-lg overflow-hidden block focus:outline-none hover:opacity-90 transition"
          >
            <img
              src={images[0]}
              alt={resource?.name || "resource"}
              className="w-full h-40 object-cover"
            />
          </button>
        ) : (
          <div className="w-full h-40 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <Image className="w-8 h-8" />
          </div>
        )}

        {/* Details */}
        <div className="mt-3 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold truncate">{resource?.name}</h4>
            <Badge
              variant="secondary"
              className="capitalize bg-secondary/40 dark:bg-secondary/20"
            >
              {resource?.type ?? "resource"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {resource?.description ?? "No description provided."}
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{resource?.location ?? "Unknown"}</span>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="capitalize bg-muted/60 border-border"
            >
              {resource?.status ?? "unknown"}
            </Badge>
            <Badge variant="outline" className="bg-muted/60 border-border">
              {(resource?.maxBookingDuration ?? "N/A") + "h max"}
            </Badge>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              onClick={() => navigate(`/resources/${resource?._id}`)}
            >
              View Resource
            </Button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowImageModal(false)}
          />
          <div className="z-10 max-w-4xl w-full rounded-lg overflow-hidden bg-card text-card-foreground shadow-lg border border-border">
            <div className="relative">
              <img
                src={images[imageIndex]}
                alt={`image-${imageIndex}`}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              <div className="absolute top-3 right-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageModal(false)}
                  className="border-border bg-background/80 backdrop-blur-sm"
                >
                  Close
                </Button>
              </div>

              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-background/70 dark:bg-background/60 backdrop-blur-sm p-2 rounded-lg shadow">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setImageIndex(
                        (i) => (i - 1 + images.length) % images.length
                      )
                    }
                  >
                    Prev
                  </Button>
                  <div className="text-foreground text-sm flex items-center px-2">
                    {imageIndex + 1} / {images.length}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setImageIndex((i) => (i + 1) % images.length)
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceCard;

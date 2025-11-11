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
      <div className="rounded-xl border p-3 h-full flex flex-col">
        {images.length ? (
          <button
            onClick={() => openImage(0)}
            className="w-full h-40 rounded-lg overflow-hidden block focus:outline-none"
          >
            <img
              src={images[0]}
              alt={resource?.name || "resource"}
              className="w-full h-40 object-cover"
            />
          </button>
        ) : (
          <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
            <Image className="w-8 h-8" />
          </div>
        )}

        <div className="mt-3 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800">
              {resource?.name}
            </h4>
            <Badge>{resource?.type ?? "resource"}</Badge>
          </div>

          <p className="text-sm text-gray-600 mt-2 line-clamp-3">
            {resource?.description ?? "No description provided."}
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{resource?.location ?? "Unknown"}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <Badge variant="outline" className="capitalize">
              {resource?.status ?? "unknown"}
            </Badge>
            <Badge variant="outline">
              {(resource?.maxBookingDuration ?? "N/A") + "h max"}
            </Badge>
          </div>

          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
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
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowImageModal(false)}
          />
          <div className="z-10 max-w-4xl w-full rounded-lg overflow-hidden bg-white shadow-lg">
            <div className="relative">
              <img
                src={images[imageIndex]}
                alt={`image-${imageIndex}`}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              <div className="absolute top-3 right-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowImageModal(false)}
                >
                  Close
                </Button>
              </div>

              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 p-2 rounded">
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
                  <div className="text-white text-sm flex items-center px-2">
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

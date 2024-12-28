import React from "react";

type InfoDialogProps = {
  message: string;
  onClose: () => void;
};

const InfoDialog: React.FC<InfoDialogProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-md max-w-sm w-full text-center">
        <p className="mb-4">{message}</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={onClose}
        >
          Ok
        </button>
      </div>
    </div>
  );
};

export default InfoDialog;

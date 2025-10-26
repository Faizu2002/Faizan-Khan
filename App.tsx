import React, { useState, useCallback, useRef } from 'react';
import { editImage } from './services/geminiService';
import { UploadIcon, SparklesIcon, PictureIcon, ErrorIcon, DownloadIcon, UndoIcon, RegenerateIcon } from './components/icons';
import { fileToBase64 } from './utils/fileUtils';

interface ImageState {
  dataUrl: string;
  mimeType: string;
}

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
    <p className="text-dark-text-secondary">Faiz is thinking...</p>
  </div>
);

const ImagePanel: React.FC<{
  title: string;
  image: string | null;
  isLoading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, image, isLoading = false, error = null, children, actions }) => (
  <div className="bg-dark-card rounded-lg shadow-lg p-4 flex flex-col w-full h-full min-h-[40vh] md:min-h-0 animate-fade-in">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-dark-text-primary">{title}</h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className="relative w-full flex-grow flex items-center justify-center aspect-square bg-gray-900/50 rounded-md overflow-hidden">
      {isLoading ? (
        <Loader />
      ) : error ? (
        <div className="text-center p-4">
          <ErrorIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
        </div>
      ) : image ? (
        <img src={image} alt={title} className="object-contain w-full h-full" />
      ) : (
        children
      )}
    </div>
  </div>
);


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examplePrompts = [
    "Make the sky a vibrant sunset",
    "Add a cute robot sidekick",
    "Change the style to watercolor painting",
    "Give it a vintage, sepia tone",
  ];

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { dataUrl, mimeType } = await fileToBase64(file);
        setOriginalImage({ dataUrl, mimeType });
        setEditedImage(null);
        setError(null);
      } catch (err) {
        setError('Failed to read file. Please try another image.');
        console.error(err);
      }
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = useCallback(async () => {
    if (!originalImage || !prompt.trim()) {
      setError('Please upload an image and provide an editing prompt.');
      return;
    }
    setIsLoading(true);
    setEditedImage(null);
    setError(null);
    try {
      const base64Data = originalImage.dataUrl.split(',')[1];
      const newImage = await editImage(base64Data, originalImage.mimeType, prompt);
      setEditedImage(newImage);
    } catch (err) {
      setError('Failed to edit image with Gemini. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  const handleUndo = useCallback(() => {
    setEditedImage(null);
    setError(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    const mimeType = editedImage.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `faiz-edited-image.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [editedImage]);


  const isGenerateDisabled = isLoading || !originalImage || !prompt.trim();

  const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; 'aria-label': string }> = ({ onClick, disabled, children, 'aria-label': ariaLabel }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800/60 border border-dark-border text-dark-text-secondary rounded-md hover:bg-brand-primary/30 hover:text-brand-light hover:border-brand-secondary/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text-primary flex flex-col">
      <header className="py-4 px-6 md:px-12 text-center shadow-md bg-dark-card/50 backdrop-blur-sm">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-light">
          Faiz Image Editor
        </h1>
        <p className="text-dark-text-secondary mt-1">
          Transform your images with the power of AI
        </p>
      </header>

      <main className="flex-grow p-4 md:p-8 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <ImagePanel 
            title="Original Image"
            actions={
              originalImage && (
                <ActionButton onClick={handleImageUploadClick} aria-label="Upload a new image">
                  <UploadIcon className="w-4 h-4" /> New Image
                </ActionButton>
              )
            }
          >
             {originalImage ? (
                <img src={originalImage.dataUrl} alt="Original" className="object-contain w-full h-full" />
             ) : (
                <div className="text-center text-dark-text-secondary">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={handleImageUploadClick}
                    className="group p-8 border-2 border-dashed border-dark-border rounded-lg hover:bg-dark-border/50 hover:border-brand-primary transition-colors duration-300 flex flex-col items-center"
                  >
                    <UploadIcon className="w-12 h-12 mb-4 text-dark-text-secondary group-hover:text-brand-light transition-colors" />
                    <span className="font-semibold">Click to upload an image</span>
                    <span className="text-sm mt-1">PNG, JPG, WEBP</span>
                  </button>
                </div>
             )}
          </ImagePanel>
          <ImagePanel 
            title="Edited Image" 
            isLoading={isLoading} 
            image={editedImage} 
            error={error}
            actions={
              editedImage && !isLoading && (
                <>
                  <ActionButton onClick={handleSubmit} aria-label="Regenerate image with same prompt">
                    <RegenerateIcon className="w-4 h-4" /> Regenerate
                  </ActionButton>
                  <ActionButton onClick={handleUndo} aria-label="Undo edit and show original">
                    <UndoIcon className="w-4 h-4" /> Undo
                  </ActionButton>
                  <ActionButton onClick={handleDownload} aria-label="Download edited image">
                    <DownloadIcon className="w-4 h-4" /> Download
                  </ActionButton>
                </>
              )
            }
          >
            <div className="text-center text-dark-text-secondary">
              <PictureIcon className="w-12 h-12 mb-4" />
              <p className="font-semibold">Your edited image will appear here</p>
            </div>
          </ImagePanel>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-dark-card/80 backdrop-blur-sm shadow-2xl p-4 animate-slide-up">
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full">
              <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-secondary" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g., "Add a retro sci-fi filter"'
                className="w-full bg-gray-900/50 border border-dark-border rounded-full py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all duration-300"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && !isGenerateDisabled && handleSubmit()}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isGenerateDisabled}
              className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <SparklesIcon className="w-5 h-5" />
              Generate
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start px-1">
            <span className="text-sm text-dark-text-secondary mr-2 self-center">Try:</span>
            {examplePrompts.map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="px-3 py-1 text-xs bg-gray-800/60 border border-dark-border text-dark-text-secondary rounded-full hover:bg-brand-primary/30 hover:text-brand-light hover:border-brand-secondary/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

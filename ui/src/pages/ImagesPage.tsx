import React, { useEffect, useState } from 'react';
import { Trash2, RefreshCw, Layers, HardDrive, Calendar, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { DockerImage } from '../types';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Snackbar, { SnackbarType } from '../components/common/Snackbar';

const ImagesPage: React.FC = () => {
    const [images, setImages] = useState<DockerImage[]>([]);
    const [loading, setLoading] = useState(true);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        type: 'delete' as 'delete' | 'prune',
        imageId: '',
        imageName: '',
    });

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        isOpen: false,
        message: '',
        type: 'success' as SnackbarType,
    });

    const fetchImages = async () => {
        setLoading(true);
        try {
            const data = await api.getImages();
            setImages(data);
        } catch (error) {
            console.error('Failed to fetch images:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleDelete = async (id: string) => {
        const image = images.find(img => img.id === id);
        const imageName = image?.tags[0] || id.substring(7, 19);

        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            imageId: id,
            imageName,
        });
    };

    const handlePrune = async () => {
        setConfirmDialog({
            isOpen: true,
            type: 'prune',
            imageId: '',
            imageName: '',
        });
    };

    const handleConfirmAction = async () => {
        const { type, imageId, imageName } = confirmDialog;
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
            if (type === 'delete') {
                await api.deleteImage(imageId);
                setSnackbar({
                    isOpen: true,
                    message: `Image "${imageName}" deleted successfully`,
                    type: 'success',
                });
            } else if (type === 'prune') {
                await api.pruneImages();
                setSnackbar({
                    isOpen: true,
                    message: 'Unused images pruned successfully',
                    type: 'success',
                });
            }
            fetchImages();
        } catch (error: any) {
            console.error(`Failed to ${type} image(s):`, error);
            setSnackbar({
                isOpen: true,
                message: error.response?.data?.detail || `Failed to ${type} image(s). It may be in use by a container.`,
                type: 'error',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Docker Images</h2>
                    <p className="text-slate-400 text-sm">Manage your local Docker images.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchImages}
                        className="p-2.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Refresh list"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handlePrune}
                        className="flex items-center gap-2 px-4 py-2.5 bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30 rounded-lg font-semibold transition-all active:scale-[0.98]"
                    >
                        <AlertTriangle size={18} />
                        Prune Unused
                    </button>
                </div>
            </div>

            {/* Images List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <RefreshCw size={48} className="animate-spin opacity-20" />
                        <p className="animate-pulse">Loading images...</p>
                    </div>
                ) : images.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                        <Layers size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No images found</h3>
                        <p className="text-sm text-slate-500 mt-1">Pull or build Docker images to see them here.</p>
                    </div>
                ) : (
                    images.map(image => (
                        <div key={image.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 rounded-xl bg-slate-800">
                                        <Layers size={24} className="text-docker" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {image.tags.map((tag, idx) => (
                                                <span key={idx} className="text-base font-bold text-white break-all">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <HardDrive size={12} /> {image.size}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <Calendar size={12} /> Created: {new Date(image.created).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                ID: <code className="bg-slate-800 px-1 rounded">{image.id.substring(7, 19)}</code>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                        title="Delete image"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.type === 'delete' ? 'Delete Image' : 'Prune Unused Images'}
                message={
                    confirmDialog.type === 'delete'
                        ? `Are you sure you want to delete "${confirmDialog.imageName}"? This action cannot be undone.`
                        : 'Are you sure you want to remove all unused images? This will free up disk space but cannot be undone.'
                }
                variant={confirmDialog.type === 'prune' ? 'warning' : 'danger'}
                confirmText={confirmDialog.type === 'delete' ? 'Delete' : 'Prune'}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />

            <Snackbar
                isOpen={snackbar.isOpen}
                message={snackbar.message}
                type={snackbar.type}
                onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
            />
        </div>
    );
};

export default ImagesPage;

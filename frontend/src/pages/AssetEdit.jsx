import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import AssetForm from '../components/assets/AssetForm';
import toast from 'react-hot-toast';
import { MdArrowBack } from 'react-icons/md';

const AssetEdit = () => {
  const { id } = useParams();
  const { get, post, put, loading } = useApi();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const res = await get(`/assets/${id}`);
      setAsset(res.data);
    } catch (error) {
      navigate('/assets');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (data, pendingFiles) => {
    try {
      await put(`/assets/${id}`, data);

      // Upload new photos if any were added
      if (pendingFiles?.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((pf) => {
          formData.append('images', pf.file);
          formData.append('captions', pf.caption || '');
        });
        try {
          await post(`/assets/${id}/images`, formData);
        } catch (_) {
          toast.error('Asset updated but some photos failed to upload.');
        }
      }

      toast.success('Asset updated successfully!');
      navigate(`/assets/${id}`);
    } catch (error) {
      // handled by useApi
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/assets/${id}`)} className="p-2 rounded-lg hover:bg-gray-100">
          <MdArrowBack className="text-xl text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Asset</h1>
          <p className="text-gray-500 text-sm">{asset?.code} - {asset?.name}</p>
        </div>
      </div>

      <div className="card">
        <AssetForm initialData={asset} onSubmit={handleSubmit} loading={loading} assetId={parseInt(id)} />
      </div>
    </div>
  );
};

export default AssetEdit;

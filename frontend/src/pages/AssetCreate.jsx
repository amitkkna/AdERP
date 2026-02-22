import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import AssetForm from '../components/assets/AssetForm';
import toast from 'react-hot-toast';
import { MdArrowBack } from 'react-icons/md';

const AssetCreate = () => {
  const { post, loading } = useApi();
  const navigate = useNavigate();

  const handleSubmit = async (data, pendingFiles) => {
    try {
      const res = await post('/assets', data);
      const newId = res.data?.id;

      // Upload photos if any were added
      if (newId && pendingFiles?.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((pf) => {
          formData.append('images', pf.file);
          formData.append('captions', pf.caption || '');
        });
        try {
          await post(`/assets/${newId}/images`, formData);
        } catch (_) {
          toast.error('Asset created but some photos failed to upload.');
        }
      }

      toast.success('Asset created successfully!');
      navigate('/assets');
    } catch (error) {
      // handled by useApi
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/assets')} className="p-2 rounded-lg hover:bg-gray-100">
          <MdArrowBack className="text-xl text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Asset</h1>
          <p className="text-gray-500 text-sm">Add a new billboard, unipole or hoarding</p>
        </div>
      </div>

      <div className="card">
        <AssetForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default AssetCreate;

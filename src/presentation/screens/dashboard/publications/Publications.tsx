import { useState } from 'react';
import PublicationsForm from '../../../components/shared/forms/PublicationsForm';

const Publications  = () => {
    const [isOpen, setIsOpen] = useState(false);

    const onClose = () => {
        setIsOpen(!isOpen);
    }
  

  return (
    <>  
        <header className="bg-gray-50 shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-4">
            <p className="tex-md font-medium ">Publicaciones</p>
            <button className="btn-primary h-10 mb-3" onClick={onClose}>Nueva publicación</button>
      </header>
        <PublicationsForm onClose={onClose} isOpen={isOpen}/>
    </>
  );
};

export default Publications;

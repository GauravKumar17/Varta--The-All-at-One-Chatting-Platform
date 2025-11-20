import vartaLogo from './assets/Vaartabg.png';

function App() {
  return ( 
    <div className=" flex items-center justify-center h-[100vh] w-full bg-gradient-to-tl from-lime-800 to-black" >
    <div className="flex items-center justify-center h-[15vh] w-[15vw]">
       <img src={vartaLogo} alt="varta" className='h-full w-full'/>
      </div>
    </div>
   );
}

export default App;
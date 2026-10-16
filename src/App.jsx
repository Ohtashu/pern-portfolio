import {useEffect, useState} from "react";
import Navbar from './components/navigationBar.jsx'
import {ArrowUpRight} from "lucide-react";
import "./App.css"
const skillList = [
    {number: '01', title: 'Frontend', details: 'React, CSS, HTML, chadui', level: '01'},
    {number: '02', title: 'Backend', details: 'Nodejs, ExpressJS, Javascript', level: '01'}
]

const workList = [
    {number: '01', title: 'MHACTO-BOCAUE', role: 'Web Developer', description: 'Built platform features with Next.js, React, Tailwind CSS, \nPHP, and custom REST APIs. Used AI-assisted tools \nthoughtfully to move from idea to working feature.'},
    {number: '02', title: 'Paraiso360', role: 'Quality Assurance', description: 'Worked across research, interface design, and \nimplementation to make a useful product from a blank \npage.'}
]

export default function App() {
    const [repos, setRepos] = useState([]);
    const [error, setError] = useState(false);

    const featuredProject = ['Paw-Active', 'Mythspire', 'WinLix-Util'];
    useEffect(() => {
        const getGithubRepos = async () => {
            try {
                const response = await fetch(`https://api.github.com/users/ohtashu/repos`);
                const toScript = await response.json();

                const filtered = toScript.filter(
                    (repo) => !repo.fork && featuredProject.includes(repo.name)
                );
                setRepos(filtered);
            }
            catch (error) {
                console.error('Failed to fetch repos', error);
                setError(true);
            }
        };
        getGithubRepos();
    }, []);
    return (
       <main>
           <header>
               <div className='card profile-dark'>
                   <img src="/src/assets/profile/wallhaven-lydkg2_1920x1080.png" alt="profile-picture"/>
                   <h2>Juan Carlos A. Flores</h2>
               </div>
               <Navbar/>
           </header>
           <section className="hero" id="top" arian-hidden="true">
               <div className="hero-div">
                   <h1 className="hero-title">I build clear interfaces <br/><em>with a little wonder.</em></h1>
                   <p className='hero-intro'>I'm Juan Carlos A. Flores, a web developer who likes to turn my ideas to something meaningful  and has impact</p>
                   <div className="hero-action">
                       <a href="#unknown_needed to feel up">Explore my Work</a>
                       <a href="#needed-to-another">More about me</a>
                   </div>
               </div>
           </section>
           <div className="banner">
               <div className="banner-tracker"><span>BACKEND</span><span>FRONTEND</span><span>USER-CENTERED</span>DESIGN</div>
           </div>

           <section className="section work-section" id="work" aria-labelledby="work-title">
               <div className="section-heading">
                   <div>
                       <p className="eyebrow">Selected projects / 2026</p>
                       <h2 id="work-title">Things I've made</h2>
                   </div>
                   <p className="section-note">
                       A collection of experiments, tools <br/>and things I'm proud to keep learning from.
                   </p>
               </div>

               <div className="project-grid">
                   {repos.map((repo) => (
                       <article className="project-grid" key={repo.id}>
                           <h3>{repo.name}</h3>
                           <p>{repo.description || "No Description Included."}</p>

                           <div className="project-footer">
                               <div className="tag-list">
                                   <span>{repo.language || "Code"}</span>
                               </div>

                               <a
                                   href={repo.html_url}
                                   target="_blank"
                                   rel="noreferrer"
                                   aria-label={`View ${repo.name} project`}
                               >
                                   <ArrowUpRight size={18}/>
                               </a>
                           </div>
                       </article>
                   ))}
               </div>

           </section>

           <section className="experience-skill">
               <div className="experiece-header">
                   <p>THE PATH SO FAR</p>
                   <h2>Experience <br/> <em>in progress</em></h2>
               </div>
               <p className="experience-section-note">
                   Every role has taught me to ask better questions,<br/> communicate clearly, and leave a codebase kinder than <br/>I found it.
               </p>

               <div className="main-experience">
                   {workList.map((work) => (
                       <div key={work.number} className="work-card">
                           <span>{work.experience}</span>
                           <h3>{work.title}</h3>
                           <h4>{work.role}</h4>
                           <p style={{whiteSpace: 'pre-line'}}>{work.description}</p>
                       </div>
                   ))}
               </div>
           </section>

           <section className="skills-container">
               <h3>Skills</h3>
               {skillList.map((skill) => (
                   <div key={skill.number} className="skill-card">
                       <span>{skill.number}</span>
                       <h3>{skill.title}</h3>
                       <p>{skill.details}</p>
                   </div>
               ))}
           </section>
       </main>
    )
}


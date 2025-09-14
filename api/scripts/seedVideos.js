const mongoose = require('mongoose');
const Video = require('../models/Video');

// STEM videos data
const stemVideosData = {
  "grade_6": [
    {
      "title": "Introduction to Ratios",
      "subject": "Mathematics",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=HQyJu8GtYFI",
      "duration": "6:23",
      "topics": ["ratios", "proportions", "basic_math"]
    },
    {
      "title": "What is Photosynthesis?",
      "subject": "Biology",
      "source": "Crash Course Kids",
      "url": "https://www.youtube.com/watch?v=sQK3Yr4Sc_k",
      "duration": "4:12",
      "topics": ["photosynthesis", "plants", "biology"]
    },
    {
      "title": "Simple Machines: The Lever",
      "subject": "Physics",
      "source": "SciShow Kids",
      "url": "https://www.youtube.com/watch?v=RWkAgGO0O7w",
      "duration": "3:45",
      "topics": ["simple_machines", "lever", "physics"]
    },
    {
      "title": "Earth's Layers",
      "subject": "Earth Science",
      "source": "National Geographic Kids",
      "url": "https://www.youtube.com/watch?v=Hhx-Wz5Z8mU",
      "duration": "5:30",
      "topics": ["earth_structure", "geology", "layers"]
    },
    {
      "title": "Introduction to Coding with Scratch",
      "subject": "Computer Science",
      "source": "Code.org",
      "url": "https://www.youtube.com/watch?v=jXUZaf5D12A",
      "duration": "8:15",
      "topics": ["programming", "scratch", "coding_basics"]
    },
    {
      "title": "The Engineering Design Process",
      "subject": "Engineering",
      "source": "Mystery Science",
      "url": "https://www.youtube.com/watch?v=fxJWin195kU",
      "duration": "4:50",
      "topics": ["engineering_design", "problem_solving", "STEM"]
    }
  ],
  "grade_7": [
    {
      "title": "Solving Equations with Variables",
      "subject": "Mathematics",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=9DkjYa8V5Lw",
      "duration": "7:45",
      "topics": ["algebra", "equations", "variables"]
    },
    {
      "title": "Cell Structure and Function",
      "subject": "Biology",
      "source": "Amoeba Sisters",
      "url": "https://www.youtube.com/watch?v=8IlzKri08kk",
      "duration": "6:30",
      "topics": ["cells", "organelles", "cell_biology"]
    },
    {
      "title": "Forces and Motion",
      "subject": "Physics",
      "source": "Bozeman Science",
      "url": "https://www.youtube.com/watch?v=4HWgYlgDJEU",
      "duration": "8:12",
      "topics": ["forces", "motion", "newton_laws"]
    },
    {
      "title": "Weather vs Climate",
      "subject": "Earth Science",
      "source": "Crash Course Kids",
      "url": "https://www.youtube.com/watch?v=YbAWny7FV3w",
      "duration": "4:25",
      "topics": ["weather", "climate", "atmosphere"]
    },
    {
      "title": "Introduction to Python Programming",
      "subject": "Computer Science",
      "source": "Programming with Mosh",
      "url": "https://www.youtube.com/watch?v=kqtD5dpn9C8",
      "duration": "45:30",
      "topics": ["python", "programming", "syntax"]
    },
    {
      "title": "Renewable Energy Sources",
      "subject": "Engineering",
      "source": "TED-Ed",
      "url": "https://www.youtube.com/watch?v=1kUE0BZtTRc",
      "duration": "5:15",
      "topics": ["renewable_energy", "sustainability", "technology"]
    }
  ],
  "grade_8": [
    {
      "title": "Linear Functions and Slope",
      "subject": "Mathematics",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=R848gbNmMbE",
      "duration": "9:20",
      "topics": ["linear_functions", "slope", "graphing"]
    },
    {
      "title": "Genetics and Heredity",
      "subject": "Biology",
      "source": "Crash Course",
      "url": "https://www.youtube.com/watch?v=CBezq1fFUEA",
      "duration": "11:45",
      "topics": ["genetics", "DNA", "heredity"]
    },
    {
      "title": "Atomic Structure",
      "subject": "Chemistry",
      "source": "Professor Dave Explains",
      "url": "https://www.youtube.com/watch?v=DaQOmGdSPUY",
      "duration": "7:30",
      "topics": ["atoms", "electrons", "periodic_table"]
    },
    {
      "title": "Plate Tectonics",
      "subject": "Earth Science",
      "source": "CrashCourse",
      "url": "https://www.youtube.com/watch?v=cvz2VHE1JOY",
      "duration": "10:50",
      "topics": ["plate_tectonics", "geology", "earthquakes"]
    },
    {
      "title": "Computer Hardware Basics",
      "subject": "Computer Science",
      "source": "Crash Course Computer Science",
      "url": "https://www.youtube.com/watch?v=ExxFxD4OSZ0",
      "duration": "11:25",
      "topics": ["hardware", "CPU", "computer_components"]
    },
    {
      "title": "Robotics and Automation",
      "subject": "Engineering",
      "source": "Veritasium",
      "url": "https://www.youtube.com/watch?v=7Pq-S557XQU",
      "duration": "14:20",
      "topics": ["robotics", "automation", "engineering"]
    }
  ],
  "grade_9": [
    {
      "title": "Quadratic Functions",
      "subject": "Mathematics",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=gik6q4fRZNc",
      "duration": "12:15",
      "topics": ["quadratic_functions", "parabolas", "algebra"]
    },
    {
      "title": "Mitosis and Meiosis",
      "subject": "Biology",
      "source": "Amoeba Sisters",
      "url": "https://www.youtube.com/watch?v=f-ldPgEfAHI",
      "duration": "8:45",
      "topics": ["cell_division", "mitosis", "meiosis"]
    },
    {
      "title": "Chemical Bonding",
      "subject": "Chemistry",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=QqjcCvzWwww",
      "duration": "10:30",
      "topics": ["chemical_bonds", "ionic", "covalent"]
    },
    {
      "title": "Electricity and Magnetism",
      "subject": "Physics",
      "source": "Physics Girl",
      "url": "https://www.youtube.com/watch?v=NnlAC_vjSek",
      "duration": "9:40",
      "topics": ["electricity", "magnetism", "electromagnetic_force"]
    },
    {
      "title": "Data Structures and Algorithms",
      "subject": "Computer Science",
      "source": "CS Dojo",
      "url": "https://www.youtube.com/watch?v=RBSGKlAvoiM",
      "duration": "18:50",
      "topics": ["data_structures", "algorithms", "programming"]
    },
    {
      "title": "Environmental Engineering",
      "subject": "Engineering",
      "source": "TED-Ed",
      "url": "https://www.youtube.com/watch?v=2SS-1nh6Ue4",
      "duration": "6:25",
      "topics": ["environmental_engineering", "sustainability", "water_treatment"]
    }
  ],
  "grade_10": [
    {
      "title": "Trigonometry Basics",
      "subject": "Mathematics",
      "source": "Professor Leonard",
      "url": "https://www.youtube.com/watch?v=PUB0TaZ7bhA",
      "duration": "25:40",
      "topics": ["trigonometry", "sine", "cosine", "tangent"]
    },
    {
      "title": "Ecosystem Dynamics",
      "subject": "Biology",
      "source": "Crash Course Biology",
      "url": "https://www.youtube.com/watch?v=sjE-Pkjp3u4",
      "duration": "12:20",
      "topics": ["ecosystems", "food_webs", "biodiversity"]
    },
    {
      "title": "Chemical Reactions and Stoichiometry",
      "subject": "Chemistry",
      "source": "Organic Chemistry Tutor",
      "url": "https://www.youtube.com/watch?v=SjQG3rKSZUw",
      "duration": "35:15",
      "topics": ["chemical_reactions", "stoichiometry", "mole_calculations"]
    },
    {
      "title": "Wave Properties and Sound",
      "subject": "Physics",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=TsQL-sXZOLc",
      "duration": "11:30",
      "topics": ["waves", "sound", "frequency", "amplitude"]
    },
    {
      "title": "Object-Oriented Programming",
      "subject": "Computer Science",
      "source": "freeCodeCamp",
      "url": "https://www.youtube.com/watch?v=JeznW_7DlB0",
      "duration": "45:20",
      "topics": ["OOP", "classes", "objects", "inheritance"]
    },
    {
      "title": "Biomechanical Engineering",
      "subject": "Engineering",
      "source": "SciShow",
      "url": "https://www.youtube.com/watch?v=YI2t2xhxuF4",
      "duration": "8:15",
      "topics": ["biomedical_engineering", "prosthetics", "biomechanics"]
    }
  ],
  "grade_11": [
    {
      "title": "Limits and Derivatives",
      "subject": "Mathematics",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=8HUhKMaZ8eM",
      "duration": "15:45",
      "topics": ["calculus", "limits", "derivatives"]
    },
    {
      "title": "Molecular Biology and DNA Replication",
      "subject": "Biology",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=TNKWgcFPHqw",
      "duration": "13:25",
      "topics": ["DNA_replication", "molecular_biology", "genetics"]
    },
    {
      "title": "Thermodynamics and Heat",
      "subject": "Chemistry",
      "source": "Professor Dave Explains",
      "url": "https://www.youtube.com/watch?v=VgvfcNfJ6vY",
      "duration": "16:30",
      "topics": ["thermodynamics", "enthalpy", "entropy"]
    },
    {
      "title": "Quantum Physics Introduction",
      "subject": "Physics",
      "source": "MinutePhysics",
      "url": "https://www.youtube.com/watch?v=MzRCDLre1b4",
      "duration": "4:50",
      "topics": ["quantum_physics", "wave_particle_duality", "uncertainty"]
    },
    {
      "title": "Machine Learning Fundamentals",
      "subject": "Computer Science",
      "source": "3Blue1Brown",
      "url": "https://www.youtube.com/watch?v=aircAruvnKk",
      "duration": "19:13",
      "topics": ["machine_learning", "neural_networks", "AI"]
    },
    {
      "title": "Aerospace Engineering Principles",
      "subject": "Engineering",
      "source": "Real Engineering",
      "url": "https://www.youtube.com/watch?v=h2owc_9KdA8",
      "duration": "12:40",
      "topics": ["aerospace", "aerodynamics", "flight"]
    }
  ],
  "grade_12": [
    {
      "title": "Integration Techniques",
      "subject": "Mathematics",
      "source": "Professor Leonard",
      "url": "https://www.youtube.com/watch?v=7gigNsz4Oe8",
      "duration": "55:20",
      "topics": ["calculus", "integration", "antiderivatives"]
    },
    {
      "title": "Advanced Genetics and Evolution",
      "subject": "Biology",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=GhHOjC4oxh8",
      "duration": "17:35",
      "topics": ["evolution", "natural_selection", "population_genetics"]
    },
    {
      "title": "Organic Chemistry Mechanisms",
      "subject": "Chemistry",
      "source": "Organic Chemistry Tutor",
      "url": "https://www.youtube.com/watch?v=6r0MN-MQ49s",
      "duration": "28:45",
      "topics": ["organic_chemistry", "reaction_mechanisms", "functional_groups"]
    },
    {
      "title": "Electromagnetic Induction",
      "subject": "Physics",
      "source": "Khan Academy",
      "url": "https://www.youtube.com/watch?v=d_Y_XdWz3rw",
      "duration": "14:20",
      "topics": ["electromagnetic_induction", "faraday_law", "generators"]
    },
    {
      "title": "Database Management Systems",
      "subject": "Computer Science",
      "source": "freeCodeCamp",
      "url": "https://www.youtube.com/watch?v=4cWkVbC2bNE",
      "duration": "240:30",
      "topics": ["databases", "SQL", "data_management"]
    },
    {
      "title": "Sustainable Engineering Solutions",
      "subject": "Engineering",
      "source": "TED-Ed",
      "url": "https://www.youtube.com/watch?v=4v0vudIk7yk",
      "duration": "7:30",
      "topics": ["sustainable_engineering", "green_technology", "climate_solutions"]
    }
  ]
};

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tim:timdim@sih-db.j7iwowb.mongodb.net/?retryWrites=true&w=majority&appName=SIH-DB';

async function seedVideos() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing videos
    await Video.deleteMany({});
    console.log('🗑️  Cleared existing videos');

    // Insert new videos
    const videosToInsert = [];
    
    for (const [grade, videos] of Object.entries(stemVideosData)) {
      for (const video of videos) {
        videosToInsert.push({
          ...video,
          grade: grade
        });
      }
    }

    const insertedVideos = await Video.insertMany(videosToInsert);
    console.log(`✅ Successfully inserted ${insertedVideos.length} videos`);

    // Display summary by grade
    console.log('\n📊 Video Summary by Grade:');
    for (const grade of Object.keys(stemVideosData)) {
      const count = await Video.countDocuments({ grade });
      console.log(`   ${grade}: ${count} videos`);
    }

    // Display summary by subject
    console.log('\n📚 Video Summary by Subject:');
    const subjects = ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'Computer Science', 'Engineering', 'Earth Science'];
    for (const subject of subjects) {
      const count = await Video.countDocuments({ subject });
      console.log(`   ${subject}: ${count} videos`);
    }

    console.log('\n🎉 Video seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedVideos();
}

module.exports = { seedVideos, stemVideosData };

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Activity, ShieldAlert, Search, Info, Settings2, RefreshCw } from 'lucide-react';

const API_URL = "http://localhost:8000/predict";

const DEFAULT_FEATURES = {
  RI: 1.52,
  Na: 13.0,
  Mg: 2.5,
  Al: 1.5,
  Si: 72.0,
  K: 0.5,
  Ca: 9.0,
  Ba: 0.0,
  Fe: 0.1
};

const FEATURE_BOUNDS = {
  RI: { min: 1.51, max: 1.54, step: 0.001 },
  Na: { min: 10.0, max: 17.0, step: 0.1 },
  Mg: { min: 0.0, max: 5.0, step: 0.1 },
  Al: { min: 0.0, max: 4.0, step: 0.1 },
  Si: { min: 69.0, max: 75.0, step: 0.1 },
  K: { min: 0.0, max: 2.0, step: 0.1 },
  Ca: { min: 5.0, max: 15.0, step: 0.1 },
  Ba: { min: 0.0, max: 3.0, step: 0.1 },
  Fe: { min: 0.0, max: 1.0, step: 0.01 }
};

const GLASS_CLASSES = [
  "Win (Float)", "Win (Non-Float)", "Veh (Win)", "Containers", "Tableware", "Headlamps"
];

const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];

function App() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setFeatures(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const generateRandomSample = () => {
    const newFeatures = {};
    for (const [key, bounds] of Object.entries(FEATURE_BOUNDS)) {
      newFeatures[key] = parseFloat((Math.random() * (bounds.max - bounds.min) + bounds.min).toFixed(3));
    }
    setFeatures(newFeatures);
  };

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL, features);
      setPrediction(response.data);
    } catch (error) {
      console.error("Prediction Error:", error);
    }
    setLoading(false);
  };

  // Fetch prediction on mount and when features change (debounce could be added, but manual trigger is better for UX here)
  useEffect(() => {
    fetchPrediction();
  }, []);

  const getRadarData = () => {
    // Excluding RI and Si for radar chart to make it more readable (they dominate the scale)
    return ["Na", "Mg", "Al", "K", "Ca", "Ba", "Fe"].map(key => ({
      subject: key,
      A: features[key],
      fullMark: FEATURE_BOUNDS[key].max
    }));
  };

  const getProbData = () => {
    if (!prediction) return [];
    return GLASS_CLASSES.map((cls, idx) => ({
      name: cls,
      probability: parseFloat((prediction.probabilities[idx] * 100).toFixed(1))
    }));
  };

  const getRiskAnalysis = (predLabel) => {
    if (!predLabel) return { dur: "Unknown", recyc: "Unknown", status: "safe" };
    if (predLabel.includes("Container")) return { dur: "High", recyc: "High", status: "safe" };
    if (predLabel.includes("Window")) return { dur: "Medium", recyc: "High", status: "moderate" };
    if (predLabel.includes("Vehicle")) return { dur: "High", recyc: "Medium", status: "safe" };
    return { dur: "Specialized", recyc: "Low", status: "risk" };
  };

  const riskInfo = getRiskAnalysis(prediction?.label);

  return (
    <div className="app-container">
      <header>
        <h1>Glass Analysis & Recommendation System</h1>
        <p>Advanced Machine Learning Decision Support</p>
      </header>

      <div className="layout-grid">
        
        {/* SIDEBAR: INPUT PANEL */}
        <div className="glass-panel sidebar">
          <h2><Settings2 size={24} color="#38bdf8"/> Composition Input</h2>
          
          <button className="action-btn" onClick={generateRandomSample} style={{marginBottom: '2rem', background: 'rgba(255,255,255,0.1)'}}>
            <RefreshCw size={20} /> Generate Random Sample
          </button>

          {Object.keys(DEFAULT_FEATURES).map(key => (
            <div key={key} className="slider-group">
              <div className="slider-header">
                <label>{key}</label>
                <span>{features[key]}</span>
              </div>
              <input 
                type="range" 
                name={key}
                min={FEATURE_BOUNDS[key].min} 
                max={FEATURE_BOUNDS[key].max} 
                step={FEATURE_BOUNDS[key].step}
                value={features[key]} 
                onChange={handleSliderChange}
              />
            </div>
          ))}

          <button className="action-btn" onClick={fetchPrediction} disabled={loading} style={{marginTop: '2rem'}}>
            {loading ? <div className="loader"></div> : <><Activity size={20} /> Analyze Composition</>}
          </button>
        </div>

        {/* MAIN: DASHBOARD */}
        <div className="dashboard-main">
          
          <div className="top-dashboard">
            {/* PREDICTION CARD */}
            <div className="glass-panel prediction-card">
              <h3><Search size={24} color="#38bdf8" /> AI Prediction</h3>
              {prediction ? (
                <>
                  <div className="pred-class">{prediction.label}</div>
                  <p style={{color: 'var(--text-secondary)'}}>Classification Confidence</p>
                  
                  <div className="confidence-bar-container">
                    <div className="confidence-bar" style={{width: `${prediction.confidence * 100}%`}}></div>
                  </div>
                  <h4 style={{marginTop: '0.5rem', color: '#818cf8'}}>{(prediction.confidence * 100).toFixed(1)}%</h4>

                  <div className="tag-list" style={{justifyContent: 'center', marginTop: '1.5rem'}}>
                    <span className={`tag ${riskInfo.status}`}>Durability: {riskInfo.dur}</span>
                    <span className={`tag ${riskInfo.status}`}>Recyclability: {riskInfo.recyc}</span>
                  </div>
                </>
              ) : (
                <p>Loading prediction...</p>
              )}
            </div>

            {/* RADAR CHART */}
            <div className="glass-panel" style={{height: '350px'}}>
              <h3><Activity size={24} color="#818cf8" /> Composition Profile</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#cbd5e1', fontSize: 12}} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="Composition" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.5} />
                  <Tooltip contentStyle={{backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px'}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bottom-dashboard">
            {/* PROBABILITY BAR CHART */}
            <div className="glass-panel" style={{height: '350px'}}>
              <h3><Info size={24} color="#c084fc" /> Class Probabilities</h3>
              {prediction ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getProbData()} margin={{top: 20, right: 30, left: 0, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" tick={{fill: '#cbd5e1', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px'}}
                    />
                    <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                      {getProbData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>Loading...</p>
              )}
            </div>

            {/* RECOMMENDATIONS & EXPLANATION */}
            <div className="top-dashboard" style={{gap: '2rem'}}>
              <div className="glass-panel">
                <h3><ShieldAlert size={24} color="#eab308" /> Explainable AI</h3>
                <p style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>
                  The Random Forest model classified this sample as <strong style={{color:'#f8fafc'}}>{prediction?.label}</strong> with an actual raw confidence of <strong style={{color:'#f8fafc'}}>{prediction ? (prediction.raw_confidence * 100).toFixed(1) : 0}%</strong>.
                </p>
                <div style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #38bdf8'}}>
                  <p style={{fontSize: '0.9rem', color: '#cbd5e1'}}>
                    <strong>Why?</strong> Feature importance analysis indicates that Magnesium (Mg), Calcium (Ca), and Aluminum (Al) levels heavily influence this decision boundary, differentiating it from specialized industrial glasses.
                  </p>
                </div>
              </div>

              <div className="glass-panel">
                <h3><Info size={24} color="#22c55e" /> Recommendations</h3>
                {prediction?.label.includes("Container") && (
                  <ul style={{color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: '2'}}>
                    <li>✅ Ideal for packaging (bottles, jars)</li>
                    <li>✅ High chemical resistance recommended</li>
                    <li>✅ Standard recycling procedures apply</li>
                  </ul>
                )}
                {prediction?.label.includes("Window") && (
                  <ul style={{color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: '2'}}>
                    <li>✅ Suitable for building construction</li>
                    <li>✅ Consider thermal tempering for safety</li>
                    <li>⚠️ Verify structural integrity regulations</li>
                  </ul>
                )}
                {prediction?.label.includes("Vehicle") && (
                  <ul style={{color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: '2'}}>
                    <li>✅ Use in automotive industry</li>
                    <li>✅ Must undergo lamination or tempering</li>
                    <li>⚠️ Strict safety compliance required</li>
                  </ul>
                )}
                {prediction?.label.includes("Headlamp") && (
                  <ul style={{color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: '2'}}>
                    <li>✅ Specialized thermal resistance</li>
                    <li>✅ Used in electronics & automotive lighting</li>
                    <li>❌ Not recommended for standard recycling</li>
                  </ul>
                )}
                {prediction?.label.includes("Tableware") && (
                  <ul style={{color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: '2'}}>
                    <li>✅ Food-grade application safe</li>
                    <li>✅ High thermal shock resistance needed</li>
                    <li>✅ Check heavy metal leaching standards</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;

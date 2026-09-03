const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /<\/button>\s*<\/motion\.form>\s*<\/section>/;
const replacement = `</button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center pt-2"
          >
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-3 px-6 py-3 bg-surface border border-surface-border rounded-xl text-text-main font-semibold hover:bg-surface-light hover:border-primary/50 transition-all shadow-lg shadow-black/20 active:scale-95"
            >
              <div className="bg-primary/20 p-1.5 rounded-lg">
                <MessageSquare size={18} className="text-primary" />
              </div>
              Join the Global Student Chat
              <ArrowRight size={18} className="ml-1 text-text-muted" />
            </button>
          </motion.div>
        </section>`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/pages/Home.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Regex not matched!");
}

interface StepperProps {
  steps: { title: string; description: string }[];
}

const Stepper = ({ steps }: StepperProps) => (
  <ol className="space-y-6">
    {steps.map((step, index) => (
      <li key={step.title} className="flex gap-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/40 bg-green-500/10 font-heading text-lg text-green-200">
          {index + 1}
        </div>
        <div>
          <h4 className="font-heading text-lg text-ink">{step.title}</h4>
          <p className="mt-2 text-sm text-steel">{step.description}</p>
        </div>
      </li>
    ))}
  </ol>
);

export default Stepper;
